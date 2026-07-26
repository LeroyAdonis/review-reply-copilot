import { db } from "@/lib/db";
import { reviews, responses } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export default async function ApprovePage({ searchParams }: { searchParams: Promise<{ reviewId?: string }> }) {
  const params = await searchParams;
  const reviewId = params.reviewId;
  if (!reviewId) return notFound();

  const [review] = await db.select().from(reviews).where(eq(reviews.id, reviewId)).limit(1);
  if (!review) return notFound();

  const [response] = await db.select().from(responses).where(eq(responses.reviewId, reviewId)).limit(1);
  if (!response) return notFound();

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-6 rounded-xl shadow-sm max-w-lg w-full border border-gray-100">
        <div className="mb-4">
          <span className={`text-xs px-2 py-0.5 rounded-full ${review.starRating >= 4 ? "bg-green-100 text-green-700" : review.starRating === 3 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
            {review.starRating} ★
          </span>
          <p className="mt-2 text-gray-800 italic border-l-2 border-gray-200 pl-3">
            &ldquo;{review.comment}&rdquo;
          </p>
          <p className="text-xs text-gray-400 mt-1">— {review.reviewerName || "Anonymous"}</p>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <p className="text-xs text-gray-400 uppercase mb-1">Suggested Reply</p>
          <p className="text-gray-700">{response.suggestedText}</p>
        </div>

        <div className="flex flex-col gap-2">
          <form action={async () => {
            "use server";
            await db.update(responses)
              .set({ status: "approved", publishedAt: new Date() })
              .where(eq(responses.id, response.id));
            revalidatePath(`/approve`);
            redirect(`/approve?reviewId=${reviewId}&done=1`);
          }}>
            <button type="submit" className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700">
              ✓ Approve &amp; Publish
            </button>
          </form>
          <a href={`/approve/edit?reviewId=${reviewId}`}
            className="w-full text-center bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200">
            ✏️ Edit First
          </a>
          <form action={async () => {
            "use server";
            await db.update(responses)
              .set({ status: "discarded" })
              .where(eq(responses.id, response.id));
            revalidatePath(`/approve`);
            redirect(`/approve?reviewId=${reviewId}&done=1`);
          }}>
            <button type="submit" className="w-full text-sm text-gray-400 py-2 hover:text-gray-600">
              Discard &mdash; I&apos;ll handle this myself
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
