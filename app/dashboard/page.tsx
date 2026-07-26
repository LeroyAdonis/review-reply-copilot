import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { businesses, reviews, responses } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { MockSeedButton } from "./mock-seed";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const userBusinesses = await db
    .select()
    .from(businesses)
    .where(eq(businesses.userId, session.user.id));

  if (userBusinesses.length === 0) {
    return <EmptyState />;
  }

  // Gather stats for each business
  const bizData = await Promise.all(
    userBusinesses.map(async (biz) => {
      const bizReviews = await db
        .select()
        .from(reviews)
        .where(eq(reviews.businessId, biz.id));
      const bizResponses = await db
        .select()
        .from(responses)
        .where(
          eq(responses.reviewId, biz.id)
        );

      const pending = bizResponses.filter((r) => r.status === "draft").length;
      const avgRating =
        bizReviews.length > 0
          ? (
              bizReviews.reduce((sum, r) => sum + r.starRating, 0) /
              bizReviews.length
            ).toFixed(1)
          : null;

      return { business: biz, reviewCount: bizReviews.length, pending, avgRating };
    })
  );

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-content">Dashboard</h1>
        <p className="text-sm text-content-secondary mt-1">
          {userBusinesses.length}{" "}
          {userBusinesses.length === 1 ? "business" : "businesses"} connected
        </p>
      </div>

      {/* Businesses */}
      <div className="space-y-6">
        {bizData.map(({ business, reviewCount, pending, avgRating }) => (
          <div key={business.id} className="space-y-4">
            {/* Business header card */}
            <Link
              href={`/dashboard/business/${business.id}`}
              className="block bg-surface-secondary border border-border-subtle hover:border-border-hover rounded-xl px-6 py-5 transition-all hover:shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-surface-tertiary flex items-center justify-center text-content font-semibold text-sm">
                    {business.businessName.charAt(0)}
                  </div>
                  <div>
                    <h2 className="font-semibold text-content">
                      {business.businessName}
                    </h2>
                    <p className="text-sm text-content-secondary capitalize">
                      {business.businessType} ·{" "}
                      {business.tone.replace(/_/g, " ")}
                    </p>
                  </div>
                </div>
                <span
                  className={`w-2 h-2 rounded-full ${
                    business.isActive ? "bg-success" : "bg-text-tertiary"
                  }`}
                  title={business.isActive ? "Active" : "Inactive"}
                />
              </div>

              {/* Stat cards — Penpot pattern */}
              <div className="grid grid-cols-3 gap-3">
                <StatCard
                  label="Reviews"
                  value={String(reviewCount)}
                  sub={null}
                />
                <StatCard
                  label="Rating"
                  value={avgRating ? `${avgRating}★` : "—"}
                  sub={null}
                />
                <StatCard
                  label="Pending"
                  value={String(pending)}
                  sub={pending > 0 ? "needs approval" : null}
                  warn={pending > 0}
                />
              </div>
            </Link>
          </div>
        ))}
      </div>

      {/* Add business */}
      <Link
        href="/api/businesses/connect"
        className="mt-6 inline-flex items-center gap-2 bg-accent text-surface hover:bg-accent-hover rounded-lg px-5 py-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        + Connect another business
        <span className="text-surface/60">→</span>
      </Link>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  warn,
}: {
  label: string;
  value: string;
  sub: string | null;
  warn?: boolean;
}) {
  return (
    <div className="bg-surface-tertiary rounded-lg px-3 py-2.5 text-center">
      <p className="text-xs text-content-tertiary uppercase tracking-wide mb-0.5">
        {label}
      </p>
      <p
        className={`text-lg font-bold ${
          warn ? "text-warning" : "text-content"
        }`}
      >
        {value}
      </p>
      {sub && (
        <p className="text-xs text-content-secondary mt-0.5">{sub}</p>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="max-w-md py-16">
      {/* Icon */}
      <div className="w-16 h-16 rounded-2xl bg-surface-tertiary flex items-center justify-center mb-6">
        <svg
          className="w-8 h-8 text-content-secondary"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155"
          />
        </svg>
      </div>

      <h1 className="text-2xl font-semibold text-content mb-3">
        Connect your Google Business Profile
      </h1>
      <p className="text-sm text-content-secondary leading-relaxed mb-8 max-w-sm">
        Link your business to start auto-replying to reviews in your own voice.
        Positive reviews get answered automatically. Negative ones come to your
        inbox for a quick approval.
      </p>

      <div className="flex flex-col gap-3">
        <Link
          href="/api/businesses/connect"
          className="inline-flex items-center justify-center gap-2 bg-accent text-surface hover:bg-accent-hover rounded-lg px-5 py-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          style={{ minHeight: "44px" }}
        >
          Connect Google Business Profile
          <span className="text-surface/60">→</span>
        </Link>

        <div className="pt-4 border-t border-border-subtle">
          <p className="text-xs text-content-tertiary mb-2">
            Don&apos;t have a Business Profile yet? Test with mock data.
          </p>
          <MockSeedButton />
        </div>
      </div>
    </div>
  );
}
