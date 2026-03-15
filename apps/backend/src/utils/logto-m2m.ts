import { env } from "../env.js";

/**
 * Logto Machine-to-Machine token utility.
 *
 * Obtains an access token for the Logto Management API using the
 * client_credentials grant. Uses LOGTO_M2M_APP_ID / LOGTO_M2M_APP_SECRET
 * when available, falling back to LOGTO_APP_ID / LOGTO_APP_SECRET.
 *
 * Tokens are cached in memory and refreshed 5 minutes before expiry.
 */

const MANAGEMENT_API_RESOURCE = "https://default.logto.app/api";

interface CachedToken {
  readonly token: string;
  readonly expiresAt: number;
}

let cachedM2mToken: CachedToken | null = null;

/**
 * Get a Management API access token from Logto.
 *
 * @returns The bearer token string, or null if M2M credentials are not configured.
 */
export async function getManagementToken(): Promise<string | null> {
  const clientId = env.LOGTO_M2M_APP_ID ?? env.LOGTO_APP_ID;
  const clientSecret = env.LOGTO_M2M_APP_SECRET ?? env.LOGTO_APP_SECRET;

  if (!clientId || !clientSecret) {
    return null;
  }

  if (cachedM2mToken && Date.now() < cachedM2mToken.expiresAt) {
    return cachedM2mToken.token;
  }

  try {
    const response = await fetch(`${env.LOGTO_ENDPOINT}/oidc/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
        resource: MANAGEMENT_API_RESOURCE,
        scope: "all",
      }).toString(),
    });

    if (!response.ok) {
      console.error(
        "[logto-m2m] Token request failed:",
        response.status,
        await response.text().catch(() => ""),
      );
      return null;
    }

    const data = (await response.json()) as Record<string, unknown>;
    const expiresIn = (data.expires_in as number) ?? 3600;

    cachedM2mToken = {
      token: data.access_token as string,
      // Refresh 5 minutes before expiry
      expiresAt: Date.now() + (expiresIn - 300) * 1000,
    };

    return cachedM2mToken.token;
  } catch (error) {
    console.error("[logto-m2m] Token request error:", error);
    return null;
  }
}

/** Clear the cached M2M token (useful for tests). */
export function clearM2mTokenCache(): void {
  cachedM2mToken = null;
}
