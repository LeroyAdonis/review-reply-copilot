import Link from "next/link";

export default function LandingPage() {
  return (
    <main>
      {/* Hero — left-aligned, not centered */}
      <section className="max-w-5xl mx-auto px-6 pt-24 pb-16 lg:pt-32 lg:pb-24">
        <div className="max-w-2xl">
          <h1 className="text-4xl lg:text-5xl font-semibold leading-tight tracking-tight mb-6">
            Auto-reply to your Google reviews in your own South African voice.
          </h1>
          <p className="text-lg text-text-secondary leading-relaxed mb-8 max-w-lg">
            Connect your Google Business Profile once. We handle every positive
            review automatically. Negative reviews get a draft you approve with
            one click.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/auth/sign-in"
              className="inline-flex items-center justify-center bg-accent text-bg-primary hover:bg-accent-hover rounded-lg px-6 py-3 text-base font-medium transition-colors"
            >
              Get Started Free
            </Link>
            <Link
              href="#how-it-works"
              className="inline-flex items-center justify-center border border-border hover:border-border-hover rounded-lg px-6 py-3 text-base font-medium text-text-primary transition-colors"
            >
              How it works
            </Link>
          </div>
        </div>
      </section>

      {/* How it works — numbered steps, not icon cards */}
      <section
        id="how-it-works"
        className="max-w-5xl mx-auto px-6 py-16 lg:py-24 border-t border-border"
      >
        <h2 className="text-2xl font-semibold mb-12">How it works</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <Step number={1} title="Connect your profile">
            Sign in with Google and connect your Business Profile in under a
            minute. We&apos;ll handle the rest.
          </Step>
          <Step number={2} title="Set your tone">
            Pick Professional, Warm &amp; Casual, or Short &amp; Sweet.
            We&apos;ll match your exact voice.
          </Step>
          <Step number={3} title="Forget about it">
            Every new review gets a reply. You get a weekly digest. That&apos;s
            it.
          </Step>
        </div>
      </section>

      {/* Proof — quiet, not boastful */}
      <section className="max-w-5xl mx-auto px-6 py-16 lg:py-24 border-t border-border">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-text-tertiary uppercase tracking-wider mb-4">
            What business owners say
          </p>
          <blockquote className="text-xl text-text-secondary leading-relaxed">
            &ldquo;I used to spend 20 minutes every morning replying to
            reviews. Now I don&apos;t think about it. The responses actually
            sound like me.&rdquo;
          </blockquote>
          <p className="mt-4 text-sm text-text-tertiary">
            — Sarah, salon owner, Sandton
          </p>
        </div>
      </section>

      {/* Pricing — clear comparison, no decoration */}
      <section className="max-w-5xl mx-auto px-6 py-16 lg:py-24 border-t border-border">
        <h2 className="text-2xl font-semibold mb-2">Simple pricing</h2>
        <p className="text-text-secondary mb-10">All prices in Rands. No hidden fees.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <PricingCard
            name="Free"
            price="R0"
            features={[
              "Up to 10 reviews/month",
              "Auto-reply to positives",
              "Drafts for negatives",
              "Email notifications",
            ]}
            cta="Start Free"
          />
          <PricingCard
            name="Starter"
            price="R299"
            popular
            features={[
              "Up to 50 reviews/month",
              "Everything in Free",
              "Weekly digest email",
              "1 Google profile",
            ]}
            cta="Start Free Trial"
          />
          <PricingCard
            name="Pro"
            price="R699"
            features={[
              "Unlimited reviews",
              "Everything in Starter",
              "Multiple profiles",
              "Export all data",
            ]}
            cta="Start Free Trial"
          />
        </div>
      </section>

      {/* Footer — minimal */}
      <footer className="max-w-5xl mx-auto px-6 py-12 border-t border-border flex flex-col sm:flex-row justify-between gap-4 text-sm text-text-tertiary">
        <span>Review Reply Copilot</span>
        <div className="flex gap-6">
          <Link href="/auth/sign-in" className="hover:text-text-secondary transition-colors">
            Sign in
          </Link>
          <a href="#" className="hover:text-text-secondary transition-colors">
            Privacy
          </a>
          <a href="#" className="hover:text-text-secondary transition-colors">
            Terms
          </a>
        </div>
      </footer>
    </main>
  );
}

function Step({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <span className="inline-block text-sm font-medium text-text-tertiary mb-3">
        {String(number).padStart(2, "0")}
      </span>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-text-secondary leading-relaxed">{children}</p>
    </div>
  );
}

function PricingCard({
  name,
  price,
  features,
  popular,
  cta,
}: {
  name: string;
  price: string;
  features: string[];
  popular?: boolean;
  cta: string;
}) {
  return (
    <div
      className={`rounded-xl p-6 ${
        popular
          ? "bg-accent text-bg-primary ring-1 ring-accent"
          : "bg-bg-secondary border border-border"
      }`}
    >
      <h3 className="text-lg font-semibold mb-1">{name}</h3>
      <p className={`text-3xl font-bold mb-1 ${popular ? "text-bg-primary" : "text-text-primary"}`}>
        {price}
        <span className={`text-sm font-normal ${popular ? "opacity-60" : "text-text-tertiary"}`}>
          /mo
        </span>
      </p>
      <ul className={`mt-4 space-y-2 mb-6 text-sm ${popular ? "opacity-80" : "text-text-secondary"}`}>
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <span className="mt-0.5 shrink-0">•</span>
            {f}
          </li>
        ))}
      </ul>
      <Link
        href="/auth/sign-in"
        className={`block text-center py-2.5 rounded-lg text-sm font-medium transition-colors ${
          popular
            ? "bg-bg-primary text-accent hover:bg-bg-tertiary"
            : "bg-accent text-bg-primary hover:bg-accent-hover"
        }`}
      >
        {cta}
      </Link>
    </div>
  );
}
