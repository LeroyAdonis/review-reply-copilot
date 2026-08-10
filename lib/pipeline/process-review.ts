import { responses, users } from "@/lib/db/schema";
import { db } from "@/lib/db/index";
import { eq } from "drizzle-orm";
import { generateResponse } from "@/lib/ai/generate-response";
import { updateReply } from "@/lib/gbp/client";
import { getValidAccessToken } from "@/lib/gbp/tokens";
import { sendNegativeReviewAlert } from "@/lib/email/client";

interface ReviewInput {
  id: string;
  googleReviewId: string;
  reviewerName: string | null;
  starRating: number;
  comment: string | null;
}

interface BusinessInput {
  id: string;
  userId: string;
  googleLocationName: string;
  businessName: string;
  businessType: string;
  tone: string;
}

export interface ProcessResult {
  reviewId: string;
  responseId: string;
  action: "auto_published" | "drafted_for_review";
  suggestedText: string;
}

export async function processNewReview(
  review: ReviewInput,
  business: BusinessInput
): Promise<ProcessResult> {
  const existing = await db
    .select()
    .from(responses)
    .where(eq(responses.reviewId, review.id))
    .limit(1);

  if (existing.length > 0 && existing[0].status !== "pending") {
    throw new Error(`Review ${review.id} already processed`);
  }

  const aiText = await generateResponse({
    reviewText: review.comment ?? "(no comment)",
    starRating: review.starRating,
    businessType: business.businessType,
    tone: business.tone,
  });

  const isPositive = review.starRating >= 4;

  if (isPositive) {
    const accessToken = await getValidAccessToken(business.id);
    await updateReply(
      `locations/${business.googleLocationName}/reviews/${review.googleReviewId}`,
      aiText,
      accessToken
    );

    const responseId = existing.length > 0 ? existing[0].id : undefined;

    if (responseId) {
      await db
        .update(responses)
        .set({
          status: "published",
          suggestedText: aiText,
          finalText: aiText,
          publishedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(responses.id, responseId));
    } else {
      const [inserted] = await db
        .insert(responses)
        .values({
          reviewId: review.id,
          status: "published",
          suggestedText: aiText,
          finalText: aiText,
          publishedAt: new Date(),
        })
        .returning();

      return {
        reviewId: review.id,
        responseId: inserted.id,
        action: "auto_published",
        suggestedText: aiText,
      };
    }

    return {
      reviewId: review.id,
      responseId: responseId!,
      action: "auto_published",
      suggestedText: aiText,
    };
  }

  let responseId = existing.length > 0 ? existing[0].id : undefined;

  if (responseId) {
    await db
      .update(responses)
      .set({
        status: "draft",
        suggestedText: aiText,
        updatedAt: new Date(),
      })
      .where(eq(responses.id, responseId));
  } else {
    const [inserted] = await db
      .insert(responses)
      .values({
        reviewId: review.id,
        status: "draft",
        suggestedText: aiText,
      })
      .returning();
    responseId = inserted.id;
  }

  try {
    const [user] = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, business.userId))
      .limit(1);

    if (user?.email) {
      await sendNegativeReviewAlert(
        user.email,
        review.comment ?? "(no comment)",
        aiText,
        review.id
      );
    }
  } catch (emailErr) {
    console.error("Failed to send negative review alert:", emailErr);
  }

  return {
    reviewId: review.id,
    responseId: responseId!,
    action: "drafted_for_review",
    suggestedText: aiText,
  };
}
