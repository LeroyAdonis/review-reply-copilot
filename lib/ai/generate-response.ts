const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

export interface GenerateResponseOptions {
  reviewText: string;
  starRating: number;
  businessType: string;
  tone: string;
}

function buildPrompt(opts: GenerateResponseOptions): string {
  const sentiment =
    opts.starRating >= 4
      ? "positive"
      : opts.starRating <= 2
      ? "negative"
      : "mixed";

  const toneMap: Record<string, string> = {
    warm_casual: "Friendly and warm, like a local speaking to a neighbour",
    professional: "Professional but still personable and South African",
    enthusiastic: "Upbeat, energetic, genuinely excited",
  };

  const toneDesc = toneMap[opts.tone] ?? toneMap.warm_casual;

  return `You are replying to a Google Business Profile review for a ${opts.businessType} business in South Africa.

Review (${opts.starRating}/5 stars, ${sentiment}): "${opts.reviewText}"

TONE: ${toneDesc}

RULES:
- Write as a South African business owner
- Use natural SA English idiom (e.g. "cheers", "thanks so much", "we really appreciate it")
- Vary sentence structure — no templates, no robotic phrasing
- Maximum 200 characters total
- No hashtags, no emojis, no exclamation overload
- For positive reviews: be warm, grateful, specific where possible
- For negative reviews: acknowledge the issue sincerely, offer a constructive next step, never argue or make excuses
- Sound human, not corporate

Reply:`;
}

function getApiKey(): string {
  const key = process.env.AI_API_KEY;
  if (!key) throw new Error("AI_API_KEY is not set");
  return key;
}

function getBaseUrl(): string {
  return process.env.AI_BASE_URL ?? "https://api.deepseek.com/v1";
}

function getModel(): string {
  return process.env.AI_MODEL ?? "deepseek-chat";
}

async function callAI(prompt: string): Promise<string> {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl.replace(/\/$/, "")}/chat/completions`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: getModel(),
      messages: [{ role: "user", content: prompt }],
      max_tokens: 150,
      temperature: 0.8,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`AI API error (${res.status}): ${body}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() ?? "";
}

function truncateToLimit(text: string): string {
  if (text.length <= 200) return text;
  return text.slice(0, 197).trimEnd() + "...";
}

export async function generateResponse(
  options: GenerateResponseOptions
): Promise<string> {
  const prompt = buildPrompt(options);
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const raw = await callAI(prompt);
      if (raw.length === 0) {
        throw new Error("AI returned empty response");
      }
      return truncateToLimit(raw);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * attempt));
      }
    }
  }

  throw new Error(
    `AI response generation failed after ${MAX_RETRIES} attempts: ${lastError?.message}`
  );
}
