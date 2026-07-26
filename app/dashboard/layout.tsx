import { auth } from "@/lib/auth";
import Link from "next/link";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <Link href="/dashboard" className="font-bold text-lg">
          Review Reply Copilot
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{session?.user?.email}</span>
          <Link
            href="/api/auth/signout"
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Sign out
          </Link>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
