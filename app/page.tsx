import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          Auto-reply to your Google reviews.<br />
          <span className="text-gray-500">In your own South African voice.</span>
        </h1>
        <p className="text-lg text-gray-500 max-w-xl mx-auto mb-8">
          Connect your Google Business Profile once. We handle every positive review automatically.
          Negative reviews get a draft you approve with one click. It&apos;s like having a front-desk
          person who never forgets to say &quot;thank you.&quot;
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/auth/sign-in"
            className="bg-black text-white px-8 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
          >
            Get Started Free
          </Link>
          <Link
            href="#pricing"
            className="bg-gray-100 text-gray-700 px-8 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            See Pricing
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white py-16 border-y border-gray-100">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-center mb-10">How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-xl">
                🔗
              </div>
              <h3 className="font-semibold mb-2">Connect</h3>
              <p className="text-sm text-gray-500">Connect your Google Business Profile in under a minute.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-xl">
                🎯
              </div>
              <h3 className="font-semibold mb-2">Set Your Tone</h3>
              <p className="text-sm text-gray-500">Pick Professional, Warm &amp; Casual, or Short &amp; Sweet. We&apos;ll match your voice.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-xl">
                ✨
              </div>
              <h3 className="font-semibold mb-2">Forget About It</h3>
              <p className="text-sm text-gray-500">Every new review gets a reply in your voice. You get a weekly digest.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-4xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-center mb-10">Simple pricing in Rands</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border border-gray-200 rounded-xl p-6">
            <h3 className="font-semibold text-lg mb-1">Free</h3>
            <p className="text-3xl font-bold mb-4">R0<span className="text-sm font-normal text-gray-400">/mo</span></p>
            <ul className="text-sm text-gray-600 space-y-2 mb-6">
              <li>• Up to 10 reviews/month</li>
              <li>• Auto-reply to positives</li>
              <li>• Drafts for negatives</li>
              <li>• Email notifications</li>
            </ul>
            <Link href="/auth/sign-in" className="block text-center bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-200">
              Start Free
            </Link>
          </div>

          <div className="border-2 border-black rounded-xl p-6 relative">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-3 py-1 rounded-full">Popular</span>
            <h3 className="font-semibold text-lg mb-1">Starter</h3>
            <p className="text-3xl font-bold mb-4">R299<span className="text-sm font-normal text-gray-400">/mo</span></p>
            <ul className="text-sm text-gray-600 space-y-2 mb-6">
              <li>• Up to 50 reviews/month</li>
              <li>• Everything in Free</li>
              <li>• Weekly digest email</li>
              <li>• 1 Google profile</li>
            </ul>
            <Link href="/auth/sign-in" className="block text-center bg-black text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-800">
              Start Free Trial
            </Link>
          </div>

          <div className="border border-gray-200 rounded-xl p-6">
            <h3 className="font-semibold text-lg mb-1">Pro</h3>
            <p className="text-3xl font-bold mb-4">R699<span className="text-sm font-normal text-gray-400">/mo</span></p>
            <ul className="text-sm text-gray-600 space-y-2 mb-6">
              <li>• Unlimited reviews</li>
              <li>• Multiple profiles</li>
              <li>• Priority processing</li>
              <li>• Export all data</li>
            </ul>
            <Link href="/auth/sign-in" className="block text-center bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-200">
              Start Free Trial
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
