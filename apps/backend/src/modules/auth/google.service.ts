import { OAuth2Client } from "google-auth-library";
import { env } from "../../env.js";
import { logger } from "../../middleware/logger.js";

const log = logger.child({ module: "google-auth" });

let client: OAuth2Client | null = null;

function getClient(): OAuth2Client {
  if (!client) {
    client = new OAuth2Client(env.GOOGLE_WEB_CLIENT_ID);
  }
  return client;
}

export interface GoogleUserInfo {
  readonly googleId: string;
  readonly email: string;
  readonly name?: string;
  readonly picture?: string;
  readonly emailVerified: boolean;
}

export async function verifyGoogleIdToken(
  idToken: string,
): Promise<GoogleUserInfo> {
  const ticket = await getClient().verifyIdToken({
    idToken,
    audience: env.GOOGLE_WEB_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  if (!payload || !payload.sub || !payload.email) {
    throw new Error("Invalid Google token: missing required claims");
  }

  log.info({ googleId: payload.sub, email: payload.email }, "Google token verified");

  return {
    googleId: payload.sub,
    email: payload.email,
    name: payload.name,
    picture: payload.picture,
    emailVerified: payload.email_verified ?? false,
  };
}
