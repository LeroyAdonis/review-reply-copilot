import { auth } from "@/lib/auth";
import Link from "next/link";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div className="min-h-screen bg-bg-primary">
      <header className="bg-bg-secondary border-b border-border px-6 py-4 flex items-center justify-between">
        <Link
          href="/dashboard"
          className="text-base font-semibold text-text-primary"
        >
          Review Reply Copilot
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-sm text-text-secondary">
            {session?.user?.email}
          </span>
          <Link
            href="/api/auth/signout"
            className="text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            Sign out
          </Link>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
