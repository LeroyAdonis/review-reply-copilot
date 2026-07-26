import { reviews, responses } from "@/lib/db/schema";
import { db } from "@/lib/db/index";
import { eq, and } from "drizzle-orm";

const GBP_BASE_URL = "https://mybusiness.googleapis.com/v4";

export interface GbpReview {
  name: string;
  reviewId: string;
  commenter: { displayName: string; profilePhotoUrl: string };
  starRating: "ONE" | "TWO" | "THREE" | "FOUR" | "FIVE";
  comment: string;
  createTime: string;
  updateTime: string;
  reviewReply?: { comment: string; updateTime: string };
}

export interface ListReviewsResponse {
  reviews: GbpReview[];
  nextPageToken?: string;
}

function authHeaders(accessToken: string) {
  return {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };
}

function starRatingToNumber(rating: GbpReview["starRating"]): number {
  const map: Record<string, number> = {
    ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5,
  };
  return map[rating] ?? 0;
}

export async function listReviews(
  locationName: string,
  accessToken: string,
  pageToken?: string
): Promise<ListReviewsResponse> {
  const params = new URLSearchParams({ pageSize: "50" });
  if (pageToken) params.set("pageToken", pageToken);

  const url = `${GBP_BASE_URL}/${locationName}/reviews?${params}`;
  const res = await fetch(url, { headers: authHeaders(accessToken) });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GBP listReviews failed (${res.status}): ${body}`);
  }

  return res.json();
}

export async function fetchAllReviews(
  locationName: string,
  accessToken: string
): Promise<GbpReview[]> {
  const all: GbpReview[] = [];
  let pageToken: string | undefined;

  do {
    const page = await listReviews(locationName, accessToken, pageToken);
    all.push(...page.reviews);
    pageToken = page.nextPageToken;
  } while (pageToken);

  return all;
}

export async function getReview(
  reviewName: string,
  accessToken: string
): Promise<GbpReview> {
  const url = `${GBP_BASE_URL}/${reviewName}`;
  const res = await fetch(url, { headers: authHeaders(accessToken) });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GBP getReview failed (${res.status}): ${body}`);
  }

  return res.json();
}

export async function updateReply(
  reviewName: string,
  comment: string,
  accessToken: string
): Promise<void> {
  const url = `${GBP_BASE_URL}/${reviewName}:updateReply`;
  const res = await fetch(url, {
    method: "PUT",
    headers: authHeaders(accessToken),
    body: JSON.stringify({ comment }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GBP updateReply failed (${res.status}): ${body}`);
  }
}

export async function updateReview(
  reviewName: string,
  comment: string,
  accessToken: string
): Promise<void> {
  const url = `${GBP_BASE_URL}/${reviewName}`;
  const res = await fetch(url, {
    method: "PATCH",
    headers: authHeaders(accessToken),
    body: JSON.stringify({ comment }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GBP updateReview failed (${res.status}): ${body}`);
  }
}

export async function fetchAndStoreReviews(
  locationName: string,
  accessToken: string,
  businessId: string
): Promise<number> {
  const gbpReviews = await fetchAllReviews(locationName, accessToken);
  let stored = 0;

  for (const gbp of gbpReviews) {
    const existing = await db
      .select()
      .from(reviews)
      .where(
        and(
          eq(reviews.googleReviewId, gbp.reviewId),
          eq(reviews.businessId, businessId)
        )
      )
      .limit(1);

    if (existing.length > 0) continue;

    const [inserted] = await db
      .insert(reviews)
      .values({
        businessId,
        googleReviewId: gbp.reviewId,
        reviewerName: gbp.commenter?.displayName ?? null,
        starRating: starRatingToNumber(gbp.starRating),
        comment: gbp.comment,
        reviewCreatedAt: new Date(gbp.createTime),
      })
      .returning();

    const replyStatus = gbp.reviewReply ? "published" : "pending";

    await db.insert(responses).values({
      reviewId: inserted.id,
      status: replyStatus,
      suggestedText: gbp.reviewReply?.comment ?? null,
      finalText: gbp.reviewReply?.comment ?? null,
    });

    stored++;
  }

  return stored;
}
