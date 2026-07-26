import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { businesses, reviews, responses } from "@/lib/db/schema";
import { db } from "@/lib/db/index";
import { eq } from "drizzle-orm";

function escapeCsv(value: string | number | null): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userBusinesses = await db
    .select()
    .from(businesses)
    .where(eq(businesses.userId, session.user.id));

  const headers = [
    "Business Name",
    "Google Location",
    "Reviewer",
    "Star Rating",
    "Review Text",
    "Review Date",
    "Response Status",
    "Suggested Response",
    "Final Response",
    "Published At",
  ];

  const rows: string[][] = [];

  for (const business of userBusinesses) {
    const businessReviews = await db
      .select()
      .from(reviews)
      .where(eq(reviews.businessId, business.id));

    for (const review of businessReviews) {
      const responseList = await db
        .select()
        .from(responses)
        .where(eq(responses.reviewId, review.id))
        .limit(1);

      const response = responseList[0];

      rows.push([
        escapeCsv(business.businessName),
        escapeCsv(business.googleLocationName),
        escapeCsv(review.reviewerName),
        escapeCsv(review.starRating),
        escapeCsv(review.comment),
        escapeCsv(review.reviewCreatedAt?.toISOString()),
        escapeCsv(response?.status ?? ""),
        escapeCsv(response?.suggestedText ?? ""),
        escapeCsv(response?.finalText ?? ""),
        escapeCsv(response?.publishedAt?.toISOString() ?? ""),
      ]);
    }
  }

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="reviews-export-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}
