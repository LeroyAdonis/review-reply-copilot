import { db } from "@/lib/db";
import { reviews, responses } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export default async function ApprovePage({
  searchParams,
}: {
  searchParams: Promise<{ reviewId?: string; done?: string }>;
}) {
  const params = await searchParams;
  const reviewId = params.reviewId;
  if (!reviewId) return notFound();

  const [review] = await db
    .select()
    .from(reviews)
    .where(eq(reviews.id, reviewId))
    .limit(1);
  if (!review) return notFound();

  const [response] = await db
    .select()
    .from(responses)
    .where(eq(responses.reviewId, reviewId))
    .limit(1);
  if (!response) return notFound();

  const isDone = params.done === "1";

  return (
    <main className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="bg-surface-secondary p-6 rounded-xl border border-border-subtle max-w-lg w-full shadow-sm">
        {isDone ? (
          <div className="text-center py-4">
            <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-content mb-1">Done!</h2>
            <p className="text-sm text-content-secondary">Your response has been saved.</p>
          </div>
        ) : (
          <>
            {/* Review content */}
            <div className="mb-5">
              <span
                className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${
                  review.starRating >= 4
                    ? "bg-success/10 text-success"
                    : review.starRating === 3
                    ? "bg-warning/10 text-warning"
                    : "bg-error/10 text-error"
                }`}
              >
                {review.starRating} ★
              </span>
              <blockquote className="mt-3 text-content-secondary italic border-l-2 border-border-subtle pl-3 leading-relaxed">
                &ldquo;{review.comment}&rdquo;
              </blockquote>
              <p className="text-xs text-content-tertiary mt-1.5">
                — {review.reviewerName || "Anonymous"}
              </p>
            </div>

            {/* Suggested reply */}
            <div className="bg-surface-tertiary p-4 rounded-lg mb-6">
              <p className="text-xs font-medium text-content-tertiary uppercase tracking-wide mb-1.5">
                Suggested Reply
              </p>
              <p className="text-content text-sm leading-relaxed">
                {response.suggestedText}
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              {/* Approve */}
              <form
                action={async () => {
                  "use server";
                  await db
                    .update(responses)
                    .set({
                      status: "approved",
                      finalText: response.suggestedText,
                      publishedAt: new Date(),
                      updatedAt: new Date(),
                    })
                    .where(eq(responses.id, response.id));
                  revalidatePath("/approve");
                  redirect(`/approve?reviewId=${reviewId}&done=1`);
                }}
              >
                <button
                  type="submit"
                  className="w-full h-11 bg-success text-white rounded-lg text-sm font-medium hover:bg-success/90 active:scale-[0.98] transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-success"
                >
                  ✓ Approve &amp; Publish
                </button>
              </form>

              {/* Edit */}
              <a
                href={`/approve/edit?reviewId=${reviewId}`}
                className="w-full h-11 flex items-center justify-center bg-surface-tertiary text-content rounded-lg text-sm font-medium hover:bg-surface-tertiary/80 active:scale-[0.98] transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                ✏️ Edit First
              </a>

              {/* Discard */}
              <form
                action={async () => {
                  "use server";
                  await db
                    .update(responses)
                    .set({ status: "discarded", updatedAt: new Date() })
                    .where(eq(responses.id, response.id));
                  revalidatePath("/approve");
                  redirect(`/approve?reviewId=${reviewId}&done=1`);
                }}
              >
                <button
                  type="submit"
                  className="w-full text-sm text-content-tertiary hover:text-content py-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  Discard — I&apos;ll handle this myself
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
