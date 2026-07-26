import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { businesses } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const userBusinesses = await db
    .select()
    .from(businesses)
    .where(eq(businesses.userId, session.user.id));

  if (userBusinesses.length === 0) {
    return (
      <EmptyState />
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold">Reviews</h1>
          <p className="text-sm text-text-secondary mt-1">
            {userBusinesses.length} {userBusinesses.length === 1 ? "business" : "businesses"} connected
          </p>
        </div>
        <Link
          href="/api/businesses/connect"
          className="inline-flex items-center gap-2 bg-accent text-bg-primary hover:bg-accent-hover rounded-lg px-4 py-2 text-sm font-medium transition-colors"
        >
          + Connect another
        </Link>
      </div>

      <div className="space-y-3">
        {userBusinesses.map((biz) => (
          <Link
            key={biz.id}
            href={`/dashboard/business/${biz.id}`}
            className="block bg-bg-secondary border border-border hover:border-border-hover rounded-xl px-6 py-5 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold">{biz.businessName}</h2>
                <p className="text-sm text-text-secondary mt-0.5 capitalize">
                  {biz.businessType} · {biz.tone.replace(/_/g, " ")}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`w-2 h-2 rounded-full ${
                    biz.isActive ? "bg-success" : "bg-text-tertiary"
                  }`}
                />
                <span className="text-text-tertiary text-sm">→</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="max-w-md py-12">
      <h1 className="text-2xl font-semibold mb-3">Connect your Google Business Profile</h1>
      <p className="text-text-secondary leading-relaxed mb-8">
        Link your business to start auto-replying to reviews in your own voice.
        Positive reviews get answered automatically. Negative ones come to
        your inbox for a quick approval.
      </p>
      <Link
        href="/api/businesses/connect"
        className="inline-flex items-center gap-2 bg-accent text-bg-primary hover:bg-accent-hover rounded-lg px-5 py-3 text-sm font-medium transition-colors"
      >
        Connect Google Business Profile
        <span className="opacity-60">→</span>
      </Link>
    </div>
  );
}
