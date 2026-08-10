import { NextRequest, NextResponse } from "next/server";
import { users, businesses, reviews, responses, digestLogs } from "@/lib/db/schema";
import { db } from "@/lib/db/index";
import { eq, and, gte } from "drizzle-orm";
import { sendWeeklyDigest } from "@/lib/email/client";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const allUsers = await db.select().from(users);

  const results: Array<{ userId: string; email: string; status: string }> = [];

  for (const user of allUsers) {
    const userBusinesses = await db
      .select()
      .from(businesses)
      .where(and(eq(businesses.userId, user.id), eq(businesses.isActive, true)));

    if (userBusinesses.length === 0) continue;

    let totalReviews = 0;
    let positiveCount = 0;
    let negativeCount = 0;
    let pendingApproval = 0;
    let totalRating = 0;
    let ratingCount = 0;

    for (const business of userBusinesses) {
      const weekReviews = await db
        .select()
        .from(reviews)
        .where(
          and(
            eq(reviews.businessId, business.id),
            gte(reviews.reviewCreatedAt, oneWeekAgo)
          )
        );

      for (const review of weekReviews) {
        totalReviews++;
        totalRating += review.starRating;
        ratingCount++;

        if (review.starRating >= 4) {
          positiveCount++;
        } else {
          negativeCount++;
        }

        const responseList = await db
          .select()
          .from(responses)
          .where(eq(responses.reviewId, review.id))
          .limit(1);

        if (responseList.length > 0 && responseList[0].status === "draft") {
          pendingApproval++;
        }
      }
    }

    if (totalReviews === 0) continue;

    const avgRating = ratingCount > 0 ? Math.round((totalRating / ratingCount) * 10) : 0;

    try {
      await sendWeeklyDigest(user.email, {
        totalReviews,
        positiveCount,
        negativeCount,
        pendingApproval,
        avgRating,
      });

      await db.insert(digestLogs).values({
        userId: user.id,
        totalReviews,
        positiveCount,
        negativeCount,
        pendingApproval,
        avgRating,
      });

      results.push({ userId: user.id, email: user.email, status: "sent" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      results.push({ userId: user.id, email: user.email, status: `failed: ${msg}` });
    }
  }

  return NextResponse.json({ sent: results.length, results });
}
