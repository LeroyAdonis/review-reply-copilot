import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { businesses, reviews } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  const [biz] = await db
    .insert(businesses)
    .values({
      userId: session.user.id,
      googleLocationName: "accounts/mock/locations/mock",
      businessName: "Leroy's Test Salon",
      businessType: "salon",
      tone: "warm_casual",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  const mockReviews = [
    {
      businessId: biz.id,
      googleReviewId: "mock-review-1",
      reviewerName: "Thandi M.",
      starRating: 5,
      comment:
        "Absolutely amazing service! My hair has never looked better. Will definitely be back next month.",
      reviewCreatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
    },
    {
      businessId: biz.id,
      googleReviewId: "mock-review-2",
      reviewerName: "Sipho K.",
      starRating: 4,
      comment:
        "Great atmosphere and friendly staff. The wait was a bit long but worth it in the end.",
      reviewCreatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
    },
    {
      businessId: biz.id,
      googleReviewId: "mock-review-3",
      reviewerName: "Priya N.",
      starRating: 2,
      comment:
        "Booked for 10am, only got seen at 11. The stylist was rushed and I'm not happy with the result. Expected better for the price.",
      reviewCreatedAt: new Date(Date.now() - 1000 * 60 * 60 * 12),
    },
    {
      businessId: biz.id,
      googleReviewId: "mock-review-4",
      reviewerName: "James V.",
      starRating: 5,
      comment:
        "Best cut I've had in years. Attention to detail is incredible. Already told all my mates about this place.",
      reviewCreatedAt: new Date(Date.now() - 1000 * 60 * 60 * 3),
    },
  ];

  await db.insert(reviews).values(mockReviews);

  return NextResponse.json({
    businessId: biz.id,
    reviewCount: mockReviews.length,
  });
}
