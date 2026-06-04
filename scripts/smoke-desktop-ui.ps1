param(
  [switch]$SkipBuild,
  [int]$ApiPort = 4317,
  [int]$UiPort = 4173,
  [string]$Message = "AMD buy check"
)

$ErrorActionPreference = "Stop"

$RepoRoot = Split-Path -Parent $PSScriptRoot
$OutputRoot = Join-Path $RepoRoot "output\ui-smoke"
$PlaywrightOutput = Join-Path $RepoRoot "output\playwright"
$ApiDataDir = Join-Path $OutputRoot "api-data"
$SessionName = "gaemiguard-ui-smoke"

New-Item -ItemType Directory -Force -Path $OutputRoot, $PlaywrightOutput, $ApiDataDir | Out-Null

function Assert-Command {
  param([string]$Name)

  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "$Name is required for desktop UI smoke."
  }
}

function Wait-Http {
  param(
    [string]$Uri,
    [int]$TimeoutSeconds = 25
  )

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  do {
    try {
      return Invoke-WebRequest -Uri $Uri -UseBasicParsing -TimeoutSec 2
    } catch {
      Start-Sleep -Milliseconds 250
    }
  } while ((Get-Date) -lt $deadline)

  throw "Timed out waiting for $Uri"
}

function Invoke-PlaywrightCli {
  param([string[]]$CliArgs)

  $baseArgs = @("--yes", "--package", "@playwright/cli", "playwright-cli", "-s=$SessionName")
  $previousErrorActionPreference = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  try {
    $result = & npx @baseArgs @CliArgs 2>&1
    $exitCode = $LASTEXITCODE
  } finally {
    $ErrorActionPreference = $previousErrorActionPreference
  }

  $text = $result -join "`n"
  if ($exitCode -ne 0 -or $text -match "(?m)^Usage: playwright-cli") {
    throw "playwright-cli failed ($exitCode): $($CliArgs -join ' ')`n$($result -join "`n")"
  }

  return @($result)
}

function Save-Lines {
  param(
    [string[]]$Lines,
    [string]$Path
  )

  $Lines | Out-File -Encoding utf8 $Path
}

function Get-Ref {
  param(
    [string[]]$Snapshot,
    [string]$Pattern,
    [string]$Name
  )

  $text = $Snapshot -join "`n"
  $match = [regex]::Match($text, $Pattern)

  if (-not $match.Success) {
    throw "Could not find $Name in Playwright snapshot."
  }

  return $match.Groups["ref"].Value
}

function Stop-SmokeProcess {
  param($Process)

  if ($Process -and -not $Process.HasExited) {
    Stop-Process -Id $Process.Id -Force -ErrorAction SilentlyContinue
  }
}

function Stop-OwnedListeners {
  param([int[]]$Ports)

  foreach ($port in $Ports) {
    $listeners = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    foreach ($listener in $listeners) {
      $owner = $listener.OwningProcess
      $proc = Get-CimInstance Win32_Process -Filter "ProcessId=$owner" -ErrorAction SilentlyContinue
      if (
        $proc -and (
          $proc.CommandLine -like "*GaemiGuard*" -or
          $proc.CommandLine -like "*tsx src/server.ts*" -or
          $proc.CommandLine -like "*apps/desktop/dist*" -or
          $proc.CommandLine -like "*apps\desktop\dist*"
        )
      ) {
        Stop-Process -Id $owner -Force -ErrorAction SilentlyContinue
      }
    }
  }
}

Assert-Command "pnpm.cmd"
Assert-Command "npx.cmd"
Assert-Command "python.exe"

if (-not $SkipBuild) {
  Push-Location $RepoRoot
  try {
    pnpm --filter @gaemiguard/desktop build
  } finally {
    Pop-Location
  }
}

$distPath = Join-Path $RepoRoot "apps\desktop\dist"
if (-not (Test-Path (Join-Path $distPath "index.html"))) {
  throw "Desktop dist is missing. Run pnpm --filter @gaemiguard/desktop build first."
}

$apiOut = Join-Path $OutputRoot "desktop-smoke-api.out.log"
$apiErr = Join-Path $OutputRoot "desktop-smoke-api.err.log"
$staticOut = Join-Path $OutputRoot "desktop-smoke-static.out.log"
$staticErr = Join-Path $OutputRoot "desktop-smoke-static.err.log"
Remove-Item -Force -ErrorAction SilentlyContinue $apiOut, $apiErr, $staticOut, $staticErr

$apiDataLiteral = $ApiDataDir.Replace("'", "''")
$apiCommand = "`$env:GAEMIGUARD_API_PORT = '$ApiPort'; `$env:GAEMIGUARD_DATA_DIR = '$apiDataLiteral'; pnpm --filter @gaemiguard/api start"

$apiProcess = $null
$staticProcess = $null

try {
  $apiProcess = Start-Process `
    -FilePath "powershell.exe" `
    -ArgumentList @("-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", $apiCommand) `
    -WorkingDirectory $RepoRoot `
    -PassThru `
    -WindowStyle Hidden `
    -RedirectStandardOutput $apiOut `
    -RedirectStandardError $apiErr

  $staticProcess = Start-Process `
    -FilePath "python.exe" `
    -ArgumentList @("-m", "http.server", "$UiPort", "--bind", "127.0.0.1", "--directory", $distPath) `
    -WorkingDirectory $RepoRoot `
    -PassThru `
    -WindowStyle Hidden `
    -RedirectStandardOutput $staticOut `
    -RedirectStandardError $staticErr

  Wait-Http "http://127.0.0.1:$ApiPort/health" | Out-Null
  Wait-Http "http://127.0.0.1:$UiPort/" | Out-Null

  $favicon = Wait-Http "http://127.0.0.1:$UiPort/favicon.svg"
  if ($favicon.Headers["Content-Type"] -notmatch "image/svg\+xml") {
    throw "favicon.svg returned unexpected content type: $($favicon.Headers["Content-Type"])"
  }

  try {
    Invoke-PlaywrightCli @("close") | Out-Null
  } catch {
    # Closing a missing session is harmless.
  }

  Invoke-PlaywrightCli @("open", "http://127.0.0.1:$UiPort/") | Out-Null
  Invoke-PlaywrightCli @("resize", "1440", "900") | Out-Null

  $before = Invoke-PlaywrightCli @("snapshot")
  Save-Lines $before (Join-Path $PlaywrightOutput "gaemiguard-desktop-smoke.before.txt")

  $blockedBadge = Invoke-PlaywrightCli @("eval", "document.querySelectorAll('.mode-badge.blocked').length > 0")
  if (($blockedBadge -join "`n") -notmatch "true") {
    throw "Home screen does not show the blocked live-order badge."
  }

  $inputRef = Get-Ref $before "- textbox .*?\[ref=(?<ref>e\d+)\]" "Commander textbox"
  $sendRef = Get-Ref $before "- button `"send`" \[ref=(?<ref>e\d+)\]" "send button"

  Invoke-PlaywrightCli @("fill", $inputRef, $Message) | Out-Null
  Invoke-PlaywrightCli @("click", $sendRef) | Out-Null

  $after = $null
  $reviewReady = $false
  $deadline = (Get-Date).AddSeconds(20)
  do {
    Start-Sleep -Milliseconds 500
    $reviewState = Invoke-PlaywrightCli @("eval", "document.querySelector('.review-card') !== null && document.querySelector('.run-details summary') !== null")
    if (($reviewState -join "`n") -match "true") {
      $reviewReady = $true
      break
    }
  } while ((Get-Date) -lt $deadline)

  $after = Invoke-PlaywrightCli @("snapshot")
  Save-Lines $after (Join-Path $PlaywrightOutput "gaemiguard-desktop-smoke.after.txt")

  if (-not $reviewReady) {
    throw "Review card or run-log disclosure was not rendered after Commander send."
  }

  $composerInputDisabled = Invoke-PlaywrightCli @("eval", "document.querySelector('.composer input').disabled")
  if (($composerInputDisabled -join "`n") -notmatch "false") {
    throw "Composer input was not re-enabled after Commander response."
  }

  $nextInputRef = Get-Ref $after "- textbox .*?\[ref=(?<ref>e\d+)\]" "Commander textbox after response"
  Invoke-PlaywrightCli @("fill", $nextInputRef, "next check") | Out-Null

  $buttonDisabled = Invoke-PlaywrightCli @("eval", "document.querySelector('.composer button[aria-label=`"send`"]').disabled")
  if (($buttonDisabled -join "`n") -notmatch "false") {
    throw "Composer send button did not become enabled after entering the next message."
  }

  $console = Invoke-PlaywrightCli @("console", "warning")
  Save-Lines $console (Join-Path $PlaywrightOutput "gaemiguard-desktop-smoke.console.txt")
  if (($console -join "`n") -notmatch "Errors: 0, Warnings: 0") {
    throw "Browser console has errors or warnings. See output/playwright/gaemiguard-desktop-smoke.console.txt"
  }

  Invoke-PlaywrightCli @("screenshot") | Out-Null
  Invoke-PlaywrightCli @("close") | Out-Null

  Write-Host "Desktop UI smoke passed."
  Write-Host "Verified: favicon 200, blocked order banner, Commander review card, run-log toggle, composer input re-enabled, console clean."
} finally {
  try {
    Invoke-PlaywrightCli @("close") | Out-Null
  } catch {
    # Ignore cleanup-only failures.
  }

  Stop-SmokeProcess $staticProcess
  Stop-SmokeProcess $apiProcess
  Stop-OwnedListeners @($UiPort, $ApiPort)
}
