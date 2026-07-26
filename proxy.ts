import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isAuthRoute = req.nextUrl.pathname.startsWith("/auth");
  const isApiRoute = req.nextUrl.pathname.startsWith("/api");

  // Allow unauthenticated access to auth pages and some API routes
  if (isAuthRoute) return NextResponse.next();
  if (isApiRoute) return NextResponse.next();

  // Protect dashboard and other pages
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/auth/sign-in", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
