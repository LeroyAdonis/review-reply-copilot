import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { responses, reviews, businesses } from "@/lib/db/schema";
import { db } from "@/lib/db/index";
import { eq, and } from "drizzle-orm";
import { getValidAccessToken } from "@/lib/gbp/tokens";
import { updateReply } from "@/lib/gbp/client";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const [response] = await db
    .select()
    .from(responses)
    .where(eq(responses.id, id))
    .limit(1);

  if (!response) {
    return NextResponse.json({ error: "Response not found" }, { status: 404 });
  }

  if (response.status !== "draft") {
    return NextResponse.json(
      { error: `Response status is "${response.status}", expected "draft"` },
      { status: 400 }
    );
  }

  const [review] = await db
    .select()
    .from(reviews)
    .where(eq(reviews.id, response.reviewId))
    .limit(1);

  if (!review) {
    return NextResponse.json({ error: "Review not found" }, { status: 404 });
  }

  const [business] = await db
    .select()
    .from(businesses)
    .where(
      and(
        eq(businesses.id, review.businessId),
        eq(businesses.userId, session.user.id)
      )
    )
    .limit(1);

  if (!business) {
    return NextResponse.json({ error: "Business not found or access denied" }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const finalText: string = body.text ?? response.suggestedText ?? response.finalText;

  if (!finalText) {
    return NextResponse.json({ error: "No response text to approve" }, { status: 400 });
  }

  try {
    const accessToken = await getValidAccessToken(business.id);

    await updateReply(
      `locations/${business.googleLocationName}/reviews/${review.googleReviewId}`,
      finalText,
      accessToken
    );

    await db
      .update(responses)
      .set({
        status: "published",
        finalText,
        approvedAt: new Date(),
        publishedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(responses.id, id));

    return NextResponse.json({ success: true, responseId: id });
  } catch (err) {
    console.error("Approve response error:", err);
    const message = err instanceof Error ? err.message : "Failed to publish response";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
