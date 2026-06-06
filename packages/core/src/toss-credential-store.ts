import { spawn } from "node:child_process";
import type { TossClientCredentials, TossCredentialProvider } from "./toss-readonly-connector";

export type TossCredentialStoreProvider =
  | "windows_credential_manager"
  | "fake_os_credential_store"
  | "unsupported_os_credential_store";

export type TossCredentialSetupInput = {
  clientId: string;
  clientSecret: string;
};

export type TossCredentialStoreStatus = {
  configured: boolean;
  provider: TossCredentialStoreProvider;
  boundary: "production_secret_store";
  updatedAt?: string;
  message: string;
};

export interface TossCredentialStore {
  getStatus(): Promise<TossCredentialStoreStatus>;
  read(): Promise<TossClientCredentials | null>;
  write(input: TossCredentialSetupInput): Promise<TossCredentialStoreStatus>;
  clear(): Promise<TossCredentialStoreStatus>;
}

type InMemoryTossCredentialStoreOptions = {
  provider?: Extract<TossCredentialStoreProvider, "fake_os_credential_store">;
  clock?: () => Date;
};

function configuredStatus(input: {
  provider: TossCredentialStoreProvider;
  configured: boolean;
  updatedAt?: string;
}): TossCredentialStoreStatus {
  const message = input.configured
    ? "Toss credentials are configured in the OS credential boundary. Secrets are not returned by status APIs."
    : "Toss credentials are not configured.";
  return {
    configured: input.configured,
    provider: input.provider,
    boundary: "production_secret_store",
    message,
    ...(input.updatedAt ? { updatedAt: input.updatedAt } : {})
  };
}

export function createInMemoryTossCredentialStore(
  options: InMemoryTossCredentialStoreOptions = {}
): TossCredentialStore {
  const provider = options.provider ?? "fake_os_credential_store";
  const clock = options.clock ?? (() => new Date());
  let credentials: TossClientCredentials | null = null;
  let updatedAt: string | undefined;

  return {
    async getStatus(): Promise<TossCredentialStoreStatus> {
      return configuredStatus({ provider, configured: credentials !== null, ...(updatedAt ? { updatedAt } : {}) });
    },

    async read(): Promise<TossClientCredentials | null> {
      return credentials ? { ...credentials } : null;
    },

    async write(input: TossCredentialSetupInput): Promise<TossCredentialStoreStatus> {
      updatedAt = clock().toISOString();
      credentials = {
        clientId: input.clientId,
        clientSecret: input.clientSecret,
        boundary: "production_secret_store"
      };
      return configuredStatus({ provider, configured: true, updatedAt });
    },

    async clear(): Promise<TossCredentialStoreStatus> {
      updatedAt = clock().toISOString();
      credentials = null;
      return configuredStatus({ provider, configured: false, updatedAt });
    }
  };
}

type WindowsCredentialCommandPayload =
  | { operation: "status" | "read" | "delete"; targetName: string }
  | ({ operation: "write"; targetName: string } & TossCredentialSetupInput);

const WINDOWS_CREDENTIAL_SCRIPT = String.raw`
$ErrorActionPreference = "Stop"
$inputText = [Console]::In.ReadToEnd()
$payload = $inputText | ConvertFrom-Json

Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;

public static class GaemiGuardCredentialManager {
  [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
  public struct CREDENTIAL {
    public UInt32 Flags;
    public UInt32 Type;
    [MarshalAs(UnmanagedType.LPWStr)]
    public string TargetName;
    [MarshalAs(UnmanagedType.LPWStr)]
    public string Comment;
    public System.Runtime.InteropServices.ComTypes.FILETIME LastWritten;
    public UInt32 CredentialBlobSize;
    public IntPtr CredentialBlob;
    public UInt32 Persist;
    public UInt32 AttributeCount;
    public IntPtr Attributes;
    [MarshalAs(UnmanagedType.LPWStr)]
    public string TargetAlias;
    [MarshalAs(UnmanagedType.LPWStr)]
    public string UserName;
  }

  [DllImport("advapi32.dll", EntryPoint = "CredReadW", CharSet = CharSet.Unicode, SetLastError = true)]
  public static extern bool CredRead(string target, UInt32 type, UInt32 reservedFlag, out IntPtr credentialPtr);

  [DllImport("advapi32.dll", EntryPoint = "CredWriteW", CharSet = CharSet.Unicode, SetLastError = true)]
  public static extern bool CredWrite(ref CREDENTIAL userCredential, UInt32 flags);

  [DllImport("advapi32.dll", EntryPoint = "CredDeleteW", CharSet = CharSet.Unicode, SetLastError = true)]
  public static extern bool CredDelete(string target, UInt32 type, UInt32 flags);

  [DllImport("advapi32.dll", EntryPoint = "CredFree", SetLastError = true)]
  public static extern void CredFree(IntPtr cred);
}
"@

$CRED_TYPE_GENERIC = 1
$CRED_PERSIST_LOCAL_MACHINE = 2
$ERROR_NOT_FOUND = 1168

function Write-Json($value) {
  $value | ConvertTo-Json -Compress
}

function Read-Credential($targetName) {
  [IntPtr]$credentialPtr = [IntPtr]::Zero
  $ok = [GaemiGuardCredentialManager]::CredRead([string]$targetName, $CRED_TYPE_GENERIC, 0, [ref]$credentialPtr)
  if (-not $ok) {
    $code = [Runtime.InteropServices.Marshal]::GetLastWin32Error()
    if ($code -eq $ERROR_NOT_FOUND) {
      return $null
    }
    throw "credential-read-failed-$code"
  }

  try {
    $credential = [Runtime.InteropServices.Marshal]::PtrToStructure($credentialPtr, [type][GaemiGuardCredentialManager+CREDENTIAL])
    $clientId = [string]$credential.UserName
    $secret = ""
    if ($credential.CredentialBlobSize -gt 0) {
      $secret = [Runtime.InteropServices.Marshal]::PtrToStringUni($credential.CredentialBlob, [int]($credential.CredentialBlobSize / 2))
    }
    return @{
      configured = $true
      clientId = $clientId
      clientSecret = $secret
    }
  } finally {
    if ($credentialPtr -ne [IntPtr]::Zero) {
      [GaemiGuardCredentialManager]::CredFree($credentialPtr)
    }
  }
}

switch ([string]$payload.operation) {
  "status" {
    $credential = Read-Credential $payload.targetName
    Write-Json @{
      configured = ($null -ne $credential)
      clientId = if ($null -ne $credential) { $credential.clientId } else { $null }
    }
  }
  "read" {
    $credential = Read-Credential $payload.targetName
    if ($null -eq $credential) {
      Write-Json @{ configured = $false }
    } else {
      Write-Json $credential
    }
  }
  "write" {
    $secretBytes = [Text.Encoding]::Unicode.GetBytes([string]$payload.clientSecret)
    [IntPtr]$blob = [IntPtr]::Zero
    try {
      $blob = [Runtime.InteropServices.Marshal]::AllocHGlobal($secretBytes.Length)
      [Runtime.InteropServices.Marshal]::Copy($secretBytes, 0, $blob, $secretBytes.Length)
      $credential = New-Object GaemiGuardCredentialManager+CREDENTIAL
      $credential.Type = $CRED_TYPE_GENERIC
      $credential.TargetName = [string]$payload.targetName
      $credential.UserName = [string]$payload.clientId
      $credential.CredentialBlobSize = [UInt32]$secretBytes.Length
      $credential.CredentialBlob = $blob
      $credential.Persist = $CRED_PERSIST_LOCAL_MACHINE
      $ok = [GaemiGuardCredentialManager]::CredWrite([ref]$credential, 0)
      if (-not $ok) {
        $code = [Runtime.InteropServices.Marshal]::GetLastWin32Error()
        throw "credential-write-failed-$code"
      }
      Write-Json @{ configured = $true; clientId = [string]$payload.clientId }
    } finally {
      if ($blob -ne [IntPtr]::Zero) {
        [Runtime.InteropServices.Marshal]::FreeHGlobal($blob)
      }
    }
  }
  "delete" {
    $ok = [GaemiGuardCredentialManager]::CredDelete([string]$payload.targetName, $CRED_TYPE_GENERIC, 0)
    if (-not $ok) {
      $code = [Runtime.InteropServices.Marshal]::GetLastWin32Error()
      if ($code -ne $ERROR_NOT_FOUND) {
        throw "credential-delete-failed-$code"
      }
    }
    Write-Json @{ configured = $false }
  }
  default {
    throw "unknown-credential-operation"
  }
}
`;

async function runWindowsCredentialCommand<T>(payload: WindowsCredentialCommandPayload): Promise<T> {
  const encodedCommand = Buffer.from(WINDOWS_CREDENTIAL_SCRIPT, "utf16le").toString("base64");
  const input = JSON.stringify(payload);

  return new Promise<T>((resolve, reject) => {
    const child = spawn("powershell.exe", ["-NoProfile", "-NonInteractive", "-EncodedCommand", encodedCommand], {
      stdio: ["pipe", "pipe", "pipe"],
      windowsHide: true
    });

    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk: string) => {
      stderr += chunk;
    });
    child.on("error", () => {
      reject(new Error("Windows credential store command failed to start."));
    });
    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`Windows credential store command failed with exit code ${code}: ${stderr.trim()}`));
        return;
      }
      try {
        resolve(JSON.parse(stdout.trim()) as T);
      } catch {
        reject(new Error("Windows credential store command returned invalid JSON."));
      }
    });
    child.stdin.end(input);
  });
}

type WindowsCredentialStoreOptions = {
  targetName?: string;
  clock?: () => Date;
};

export function createWindowsCredentialManagerTossCredentialStore(
  options: WindowsCredentialStoreOptions = {}
): TossCredentialStore {
  const targetName = options.targetName ?? "GaemiGuard:TossInvest:ClientCredentials";
  const clock = options.clock ?? (() => new Date());
  const provider = "windows_credential_manager";

  return {
    async getStatus(): Promise<TossCredentialStoreStatus> {
      const result = await runWindowsCredentialCommand<{ configured: boolean }>({
        operation: "status",
        targetName
      });
      return configuredStatus({ provider, configured: result.configured });
    },

    async read(): Promise<TossClientCredentials | null> {
      const result = await runWindowsCredentialCommand<
        { configured: false } | { configured: true; clientId: string; clientSecret: string }
      >({
        operation: "read",
        targetName
      });
      if (!result.configured) {
        return null;
      }
      return {
        clientId: result.clientId,
        clientSecret: result.clientSecret,
        boundary: "production_secret_store"
      };
    },

    async write(input: TossCredentialSetupInput): Promise<TossCredentialStoreStatus> {
      await runWindowsCredentialCommand<{ configured: boolean }>({
        operation: "write",
        targetName,
        clientId: input.clientId,
        clientSecret: input.clientSecret
      });
      return configuredStatus({ provider, configured: true, updatedAt: clock().toISOString() });
    },

    async clear(): Promise<TossCredentialStoreStatus> {
      await runWindowsCredentialCommand<{ configured: boolean }>({
        operation: "delete",
        targetName
      });
      return configuredStatus({ provider, configured: false, updatedAt: clock().toISOString() });
    }
  };
}

export function createUnsupportedTossCredentialStore(): TossCredentialStore {
  const provider = "unsupported_os_credential_store";
  return {
    async getStatus(): Promise<TossCredentialStoreStatus> {
      return {
        ...configuredStatus({ provider, configured: false }),
        message: "This platform does not have an implemented GaemiGuard OS credential-store provider."
      };
    },
    async read(): Promise<TossClientCredentials | null> {
      return null;
    },
    async write(): Promise<TossCredentialStoreStatus> {
      throw new Error("Toss credential setup requires a supported OS credential store.");
    },
    async clear(): Promise<TossCredentialStoreStatus> {
      return configuredStatus({ provider, configured: false });
    }
  };
}

export function createDefaultTossCredentialStore(): TossCredentialStore {
  if (process.platform === "win32") {
    return createWindowsCredentialManagerTossCredentialStore();
  }
  return createUnsupportedTossCredentialStore();
}

export function createTossCredentialProviderFromStore(store: TossCredentialStore): TossCredentialProvider {
  return {
    async getClientCredentials(): Promise<TossClientCredentials | null> {
      return store.read();
    }
  };
}
