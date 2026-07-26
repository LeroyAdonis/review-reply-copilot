import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { businesses } from "@/lib/db/schema";
import { db } from "@/lib/db/index";
import { eq, and } from "drizzle-orm";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const [business] = await db
    .select()
    .from(businesses)
    .where(and(eq(businesses.id, id), eq(businesses.userId, session.user.id)))
    .limit(1);

  if (!business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  await db
    .update(businesses)
    .set({
      isActive: false,
      gbpAccessToken: null,
      gbpRefreshToken: null,
      gbpTokenExpiresAt: null,
      updatedAt: new Date(),
    })
    .where(eq(businesses.id, id));

  return NextResponse.json({ success: true });
}
