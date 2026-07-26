import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { businesses } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";

export default async function BusinessSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/sign-in");

  const { id } = await params;

  const [business] = await db
    .select()
    .from(businesses)
    .where(eq(businesses.id, id))
    .limit(1);

  if (!business || business.userId !== session.user.id) return notFound();

  return (
    <div>
      <Link
        href="/dashboard"
        className="text-sm text-text-secondary hover:text-text-primary transition-colors mb-6 inline-block"
      >
        ← Back to dashboard
      </Link>

      <div className="max-w-lg">
        <h1 className="text-2xl font-semibold text-text-primary mb-1">
          {business.businessName}
        </h1>
        <p className="text-sm text-text-secondary mb-8">
          Configure your auto-reply tone and settings.
        </p>

        <form
          action={async (formData: FormData) => {
            "use server";
            const bizType = formData.get("businessType") as string;
            const tone = formData.get("tone") as string;

            await db
              .update(businesses)
              .set({
                businessType: bizType,
                tone,
                updatedAt: new Date(),
              })
              .where(eq(businesses.id, id));

            revalidatePath(`/dashboard/business/${id}`);
            redirect(`/dashboard/business/${id}`);
          }}
        >
          {/* Business type — Penpot form field pattern */}
          <div className="mb-5">
            <label
              htmlFor="businessType"
              className="block text-sm font-medium text-text-primary mb-1.5"
            >
              Business type
            </label>
            <select
              id="businessType"
              name="businessType"
              defaultValue={business.businessType}
              className="w-full h-11 px-3 rounded-lg border border-border bg-bg-secondary text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1 transition-shadow"
            >
              <option value="salon">Salon</option>
              <option value="clinic">Clinic</option>
              <option value="tradesman">Tradesman</option>
              <option value="restaurant">Restaurant</option>
              <option value="retail">Retail</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Tone — Penpot form field pattern */}
          <div className="mb-8">
            <label
              htmlFor="tone"
              className="block text-sm font-medium text-text-primary mb-1.5"
            >
              Reply tone
            </label>
            <select
              id="tone"
              name="tone"
              defaultValue={business.tone}
              className="w-full h-11 px-3 rounded-lg border border-border bg-bg-secondary text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1 transition-shadow"
            >
              <option value="warm_casual">Warm &amp; Casual — friendly, like a neighbour</option>
              <option value="professional">Professional — polished but personable</option>
              <option value="short_sweet">Short &amp; Sweet — brief and to the point</option>
            </select>
            <p className="mt-1.5 text-xs text-text-tertiary">
              This tone is used for all auto-generated review replies.
            </p>
          </div>

          <button
            type="submit"
            className="inline-flex items-center justify-center h-11 px-6 rounded-lg bg-accent text-bg-primary text-sm font-medium hover:bg-accent-hover active:scale-[0.98] transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ minWidth: "120px" }}
          >
            Save settings
          </button>
        </form>

        {/* Danger zone */}
        <div className="mt-12 pt-8 border-t border-border">
          <h2 className="text-sm font-semibold text-text-primary mb-2">
            Danger zone
          </h2>
          <p className="text-xs text-text-secondary mb-4">
            Disconnecting will stop all auto-replies for this business.
          </p>
          <form
            action={async () => {
              "use server";
              await db
                .update(businesses)
                .set({ isActive: false, updatedAt: new Date() })
                .where(eq(businesses.id, id));
              revalidatePath("/dashboard");
              redirect("/dashboard");
            }}
          >
            <button
              type="submit"
              className="text-sm text-error hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-error"
            >
              Disconnect this business
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
