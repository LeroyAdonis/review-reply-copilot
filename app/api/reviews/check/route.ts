import { NextRequest, NextResponse } from "next/server";
import { businesses, reviews } from "@/lib/db/schema";
import { db } from "@/lib/db/index";
import { eq } from "drizzle-orm";
import { getValidAccessToken } from "@/lib/gbp/tokens";
import { fetchAndStoreReviews } from "@/lib/gbp/client";
import { processNewReview } from "@/lib/pipeline/process-review";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const errors: string[] = [];
  let processed = 0;
  let newReviews = 0;

  try {
    const activeBusinesses = await db
      .select()
      .from(businesses)
      .where(eq(businesses.isActive, true));

    for (const business of activeBusinesses) {
      try {
        const accessToken = await getValidAccessToken(business.id);

        const storedCount = await fetchAndStoreReviews(
          business.googleLocationName,
          accessToken,
          business.id
        );

        if (storedCount > 0) {
          const newReviewRows = await db
            .select()
            .from(reviews)
            .where(eq(reviews.businessId, business.id))
            .orderBy(reviews.detectedAt)
            .limit(storedCount);

          for (const review of newReviewRows) {
            try {
              await processNewReview(
                {
                  id: review.id,
                  googleReviewId: review.googleReviewId,
                  reviewerName: review.reviewerName,
                  starRating: review.starRating,
                  comment: review.comment,
                },
                {
                  id: business.id,
                  userId: business.userId,
                  googleLocationName: business.googleLocationName,
                  businessName: business.businessName,
                  businessType: business.businessType,
                  tone: business.tone,
                }
              );
              processed++;
            } catch (processErr) {
              const msg = processErr instanceof Error ? processErr.message : String(processErr);
              errors.push(`Process review ${review.id}: ${msg}`);
            }
          }

          newReviews += storedCount;
        }
      } catch (businessErr) {
        const msg = businessErr instanceof Error ? businessErr.message : String(businessErr);
        errors.push(`Business ${business.id} (${business.businessName}): ${msg}`);
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    errors.push(`Fatal: ${msg}`);
  }

  return NextResponse.json({ processed, newReviews, errors });
}
