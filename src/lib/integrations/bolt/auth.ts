import { db } from "@/lib/db";

interface BoltTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

const tokenCache = new Map<string, { token: string; expiresAt: number }>();

export async function getBoltAccessToken(partnerId: string): Promise<string> {
  const cached = tokenCache.get(partnerId);
  if (cached && cached.expiresAt > Date.now() + 30000) {
    return cached.token;
  }

  const partner = await db.partner.findUniqueOrThrow({ where: { id: partnerId } });
  if (!partner.boltClientId || !partner.boltClientSecret) {
    throw new Error("Bolt API credentials not configured");
  }

  const res = await fetch("https://fleet-owner-api.bolt.eu/v1/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: partner.boltClientId,
      client_secret: partner.boltClientSecret,
      scope: "fleet:read",
    }),
  });

  if (!res.ok) {
    throw new Error(`Bolt OAuth failed: ${res.status} ${await res.text()}`);
  }

  const data: BoltTokenResponse = await res.json();
  tokenCache.set(partnerId, {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  });

  return data.access_token;
}
