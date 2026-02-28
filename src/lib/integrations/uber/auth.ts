import { db } from "@/lib/db";

interface UberTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

const tokenCache = new Map<string, { token: string; expiresAt: number }>();

export async function getUberAccessToken(partnerId: string): Promise<string> {
  const cached = tokenCache.get(partnerId);
  if (cached && cached.expiresAt > Date.now() + 60000) {
    return cached.token;
  }

  const partner = await db.partner.findUniqueOrThrow({ where: { id: partnerId } });
  if (!partner.uberClientId || !partner.uberClientSecret) {
    throw new Error("Uber API credentials not configured");
  }

  const res = await fetch("https://login.uber.com/oauth/v2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: partner.uberClientId,
      client_secret: partner.uberClientSecret,
      scope: "eats.report fleet.report",
    }),
  });

  if (!res.ok) {
    throw new Error(`Uber OAuth failed: ${res.status} ${await res.text()}`);
  }

  const data: UberTokenResponse = await res.json();
  tokenCache.set(partnerId, {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  });

  return data.access_token;
}
