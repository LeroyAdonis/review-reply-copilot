import { signIn } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function SignInPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-sm max-w-md w-full text-center">
        <h1 className="text-2xl font-bold mb-2">Review Reply Copilot</h1>
        <p className="text-gray-500 mb-8">Auto-reply to your Google reviews in your own voice.</p>

        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/dashboard" });
          }}
        >
          <button
            type="submit"
            className="w-full bg-black text-white rounded-lg py-3 font-medium hover:bg-gray-800 transition-colors"
          >
            Sign in with Google
          </button>
        </form>
      </div>
    </main>
  );
}
