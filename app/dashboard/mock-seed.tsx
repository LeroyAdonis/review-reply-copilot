"use client";

import { useRouter } from "next/navigation";

export function MockSeedButton() {
  const router = useRouter();

  async function seed() {
    const res = await fetch("/api/dev/seed", { method: "POST" });
    if (res.ok) router.refresh();
  }

  return (
    <button
      onClick={seed}
      className="text-sm text-text-tertiary hover:text-text-secondary transition-colors underline underline-offset-2"
    >
      Use mock data for testing
    </button>
  );
}
