import { NextRequest, NextResponse } from "next/server";
import { businesses } from "@/lib/db/schema";
import { db } from "@/lib/db/index";
import { eq, and } from "drizzle-orm";
import { storeTokens } from "@/lib/gbp/tokens";

interface GoogleLocation {
  name: string;
  locationName: string;
  displayName: string;
  locationId: string;
  locationState: { isGoogleVerified: boolean };
}

interface AccountsResponse {
  accounts: Array<{
    name: string;
    accountName: string;
    type: string;
    role: string;
    regionCode: string;
  }>;
}

interface LocationsResponse {
  locations: GoogleLocation[];
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const error = request.nextUrl.searchParams.get("error");

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  if (error || !code || !state) {
    return NextResponse.redirect(new URL("/dashboard?error=oauth_denied", baseUrl));
  }

  const userId = state;

  try {
    const clientId = process.env.GBP_CLIENT_ID;
    const clientSecret = process.env.GBP_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      throw new Error("GBP_CLIENT_ID and GBP_CLIENT_SECRET must be set");
    }

    const redirectUri = `${baseUrl}/api/businesses/callback`;

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      }).toString(),
    });

    if (!tokenRes.ok) {
      const body = await tokenRes.text();
      throw new Error(`Token exchange failed (${tokenRes.status}): ${body}`);
    }

    const tokenData = await tokenRes.json();
    const accessToken: string = tokenData.access_token;
    const refreshToken: string = tokenData.refresh_token;
    const expiresIn: number = tokenData.expires_in;

    const accountsRes = await fetch(
      "https://mybusinessaccountmanagement.googleapis.com/v1/accounts",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!accountsRes.ok) {
      throw new Error("Failed to fetch Google accounts");
    }

    const accountsData: AccountsResponse = await accountsRes.json();

    if (!accountsData.accounts?.length) {
      return NextResponse.redirect(new URL("/dashboard?error=no_accounts", baseUrl));
    }

    const firstAccount = accountsData.accounts[0];

    const locationsRes = await fetch(
      `https://mybusinessbusinessinformation.googleapis.com/v1/${firstAccount.name}/locations?readMask=name,locationName,displayName,locationId,locationState`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!locationsRes.ok) {
      throw new Error("Failed to fetch locations");
    }

    const locationsData: LocationsResponse = await locationsRes.json();

    for (const location of locationsData.locations ?? []) {
      const existing = await db
        .select()
        .from(businesses)
        .where(
          and(
            eq(businesses.userId, userId),
            eq(businesses.googleLocationName, location.name)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        await storeTokens(existing[0].id, accessToken, refreshToken, expiresIn);
        continue;
      }

      const [inserted] = await db
        .insert(businesses)
        .values({
          userId,
          googleLocationName: location.name,
          businessName: location.displayName || location.locationName,
          businessType: "other",
        })
        .returning();

      await storeTokens(inserted.id, accessToken, refreshToken, expiresIn);
    }

    return NextResponse.redirect(new URL("/dashboard", baseUrl));
  } catch (err) {
    console.error("OAuth callback error:", err);
    return NextResponse.redirect(new URL("/dashboard?error=callback_failed", baseUrl));
  }
}
