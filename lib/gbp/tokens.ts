import { businesses } from "@/lib/db/schema";
import { db } from "@/lib/db/index";
import { eq } from "drizzle-orm";

const GBP_TOKEN_URL = "https://oauth2.googleapis.com/token";

export function encryptToken(token: string): string {
  return Buffer.from(token, "utf-8").toString("base64");
}

export function decryptToken(encrypted: string): string {
  return Buffer.from(encrypted, "base64").toString("utf-8");
}

export async function refreshAccessToken(businessId: string): Promise<string> {
  const [business] = await db
    .select()
    .from(businesses)
    .where(eq(businesses.id, businessId))
    .limit(1);

  if (!business) {
    throw new Error(`Business not found: ${businessId}`);
  }

  if (!business.gbpRefreshToken) {
    throw new Error(`No refresh token for business: ${businessId}`);
  }

  const clientId = process.env.GBP_CLIENT_ID;
  const clientSecret = process.env.GBP_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("GBP_CLIENT_ID and GBP_CLIENT_SECRET must be set");
  }

  const refreshToken = decryptToken(business.gbpRefreshToken);

  const res = await fetch(GBP_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Token refresh failed (${res.status}): ${body}`);
  }

  const data = await res.json();
  const newAccessToken: string = data.access_token;
  const expiresIn: number = data.expires_in;

  const expiresAt = new Date(Date.now() + expiresIn * 1000);

  await db
    .update(businesses)
    .set({
      gbpAccessToken: encryptToken(newAccessToken),
      gbpTokenExpiresAt: expiresAt,
      updatedAt: new Date(),
    })
    .where(eq(businesses.id, businessId));

  return newAccessToken;
}

export async function getValidAccessToken(businessId: string): Promise<string> {
  const [business] = await db
    .select()
    .from(businesses)
    .where(eq(businesses.id, businessId))
    .limit(1);

  if (!business) {
    throw new Error(`Business not found: ${businessId}`);
  }

  if (
    business.gbpAccessToken &&
    business.gbpTokenExpiresAt &&
    new Date(business.gbpTokenExpiresAt) > new Date()
  ) {
    return decryptToken(business.gbpAccessToken);
  }

  return refreshAccessToken(businessId);
}

export async function storeTokens(
  businessId: string,
  accessToken: string,
  refreshToken: string,
  expiresIn: number
): Promise<void> {
  const expiresAt = new Date(Date.now() + expiresIn * 1000);

  await db
    .update(businesses)
    .set({
      gbpAccessToken: encryptToken(accessToken),
      gbpRefreshToken: encryptToken(refreshToken),
      gbpTokenExpiresAt: expiresAt,
      updatedAt: new Date(),
    })
    .where(eq(businesses.id, businessId));
}
