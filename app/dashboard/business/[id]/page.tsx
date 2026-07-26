import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { businesses } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

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
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-2">{business.businessName}</h1>
      <p className="text-gray-500 mb-6">Configure your auto-reply settings</p>

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
        className="space-y-4"
      >
        <div>
          <label className="block text-sm font-medium mb-1">Business Type</label>
          <select
            name="businessType"
            defaultValue={business.businessType}
            className="w-full border border-gray-200 rounded-lg p-2 text-sm"
          >
            <option value="salon">Salon</option>
            <option value="clinic">Clinic</option>
            <option value="tradesman">Tradesman</option>
            <option value="restaurant">Restaurant</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Reply Tone</label>
          <select
            name="tone"
            defaultValue={business.tone}
            className="w-full border border-gray-200 rounded-lg p-2 text-sm"
          >
            <option value="warm_casual">Warm &amp; Casual</option>
            <option value="professional">Professional</option>
            <option value="short_sweet">Short &amp; Sweet</option>
          </select>
        </div>

        <button
          type="submit"
          className="bg-black text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-800"
        >
          Save Settings
        </button>
      </form>

      <hr className="my-8 border-gray-200" />

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
          className="text-red-500 text-sm hover:underline"
        >
          Disconnect this business
        </button>
      </form>
    </div>
  );
}
