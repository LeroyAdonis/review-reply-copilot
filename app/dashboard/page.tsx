import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { businesses, reviews, responses } from "@/lib/db/schema";
import { eq, sql, and } from "drizzle-orm";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const userBusinesses = await db.select().from(businesses).where(eq(businesses.userId, session.user.id));

  if (userBusinesses.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-2">Welcome 👋</h1>
        <p className="text-gray-500 mb-6">Connect your Google Business Profile to get started.</p>
        <Link
          href="/api/businesses/connect"
          className="inline-block bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800"
        >
          Connect Google Business Profile
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Link
          href="/api/businesses/connect"
          className="text-sm bg-gray-100 px-4 py-2 rounded-lg hover:bg-gray-200"
        >
          + Add Business
        </Link>
      </div>

      <div className="grid gap-4">
        {userBusinesses.map((biz) => (
          <div key={biz.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="font-semibold text-lg">{biz.businessName}</h2>
                <p className="text-sm text-gray-500 capitalize">{biz.businessType} · {biz.tone.replace("_", " ")}</p>
              </div>
              <span className={`w-2 h-2 rounded-full ${biz.isActive ? "bg-green-500" : "bg-gray-300"}`} />
            </div>
            <div className="flex gap-4 text-sm">
              <Link href={`/dashboard/business/${biz.id}`} className="text-blue-600 hover:underline">
                View Reviews →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
