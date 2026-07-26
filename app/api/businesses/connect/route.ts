import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/auth/sign-in", process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"));
  }

  const clientId = process.env.GBP_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: "GBP_CLIENT_ID not configured" }, { status: 500 });
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/businesses/callback`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "https://www.googleapis.com/auth/business.manage",
    access_type: "offline",
    prompt: "consent",
    state: session.user.id,
  });

  return NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  );
}
