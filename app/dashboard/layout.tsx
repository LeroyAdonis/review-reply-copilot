import { auth } from "@/lib/auth";
import Link from "next/link";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div className="min-h-screen bg-surface">
      <header className="bg-surface-secondary border-b border-border-subtle px-6 py-4 flex items-center justify-between">
        <Link
          href="/dashboard"
          className="text-base font-semibold text-content"
        >
          Review Reply Copilot
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-sm text-content-secondary">
            {session?.user?.email}
          </span>
          <Link
            href="/api/auth/signout"
            className="text-sm text-content-secondary hover:text-content transition-colors"
          >
            Sign out
          </Link>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
