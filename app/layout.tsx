import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Review Reply Copilot — Auto-reply to Google reviews in your own voice",
  description:
    "Connect your Google Business Profile once. We handle every positive review automatically in your South African voice. Negative reviews get a draft you approve with one click.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-bg-primary text-text-primary antialiased">
        {children}
      </body>
    </html>
  );
}
