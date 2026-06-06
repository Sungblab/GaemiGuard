import { describe, expect, it } from "vitest";
import {
  createInMemoryTossCredentialStore,
  createTossCredentialProviderFromStore
} from "./toss-credential-store";

const SENTINEL_CLIENT_SECRET = "fixture-private-value-alpha";

describe("Toss credential store boundary", () => {
  it("sets up, reads, and disconnects Toss credentials without exposing the secret in status", async () => {
    const store = createInMemoryTossCredentialStore({
      provider: "fake_os_credential_store",
      clock: () => new Date("2026-06-06T03:00:00.000Z")
    });

    const setupStatus = await store.write({
      clientId: "fixture-client-id",
      clientSecret: SENTINEL_CLIENT_SECRET
    });

    expect(setupStatus).toMatchObject({
      configured: true,
      provider: "fake_os_credential_store",
      boundary: "production_secret_store",
      updatedAt: "2026-06-06T03:00:00.000Z"
    });
    expect(JSON.stringify(setupStatus)).not.toContain(SENTINEL_CLIENT_SECRET);

    const provider = createTossCredentialProviderFromStore(store);
    await expect(provider.getClientCredentials()).resolves.toEqual({
      clientId: "fixture-client-id",
      clientSecret: SENTINEL_CLIENT_SECRET,
      boundary: "production_secret_store"
    });

    const disconnectStatus = await store.clear();
    expect(disconnectStatus).toMatchObject({
      configured: false,
      provider: "fake_os_credential_store",
      boundary: "production_secret_store"
    });
    await expect(provider.getClientCredentials()).resolves.toBeNull();
    expect(JSON.stringify(disconnectStatus)).not.toContain(SENTINEL_CLIENT_SECRET);
  });
});
