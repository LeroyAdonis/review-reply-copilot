import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { businesses, reviews } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { v4 as uuid } from "uuid";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const bizId = uuid();
  const now = new Date();

  await db.insert(businesses).values({
    id: bizId,
    userId: session.user.id,
    googleLocationName: "accounts/107328491234567890/locations/12345678901234567890",
    businessName: "Leroy's Test Salon",
    businessType: "salon",
    tone: "warm_casual",
    isActive: true,
    createdAt: now,
    updatedAt: now,
  });

  const mockReviews = [
    {
      id: uuid(),
      businessId: bizId,
      googleReviewId: "mock-review-1",
      reviewerName: "Thandi M.",
      starRating: 5,
      comment: "Absolutely amazing service! My hair has never looked better. Will definitely be back next month.",
      reviewTime: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
      createdAt: now,
      updatedAt: now,
    },
    {
      id: uuid(),
      businessId: bizId,
      googleReviewId: "mock-review-2",
      reviewerName: "Sipho K.",
      starRating: 4,
      comment: "Great atmosphere and friendly staff. The wait was a bit long but worth it in the end.",
      reviewTime: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1),
      createdAt: now,
      updatedAt: now,
    },
    {
      id: uuid(),
      businessId: bizId,
      googleReviewId: "mock-review-3",
      reviewerName: "Priya N.",
      starRating: 2,
      comment: "Booked for 10am, only got seen at 11. The stylist was rushed and I'm not happy with the result. Expected better for the price.",
      reviewTime: new Date(Date.now() - 1000 * 60 * 60 * 12),
      createdAt: now,
      updatedAt: now,
    },
    {
      id: uuid(),
      businessId: bizId,
      googleReviewId: "mock-review-4",
      reviewerName: "James V.",
      starRating: 5,
      comment: "Best cut I've had in years. Attention to detail is incredible. Already told all my mates about this place.",
      reviewTime: new Date(Date.now() - 1000 * 60 * 60 * 3),
      createdAt: now,
      updatedAt: now,
    },
  ];

  for (const review of mockReviews) {
    await db.insert(reviews).values(review);
  }

  return NextResponse.json({ businessId: bizId, reviewCount: mockReviews.length });
}
