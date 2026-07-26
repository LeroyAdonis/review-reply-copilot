# Research: Review Reply Copilot v1

**Date:** 2026-07-26
**Plan:** plan.md

## Google Business Profile API

### Decision
Use the Google Business Profile API v4.9 (`mybusiness.googleapis.com/v4`) for listing reviews and updating replies.

### Rationale
This is Google's official API for Business Profile management. It supports:
- `accounts.locations.reviews.list` — paginated review listing (max 50 per page)
- `accounts.locations.reviews.updateReply` — creates or updates a review reply
- `accounts.locations.reviews.get` — single review retrieval

### OAuth Scope
`https://www.googleapis.com/auth/business.manage` — covers read/write access to Business Profile data including reviews and replies.

### Alternatives Considered
| Alternative | Why not chosen |
|---|---|
| Business Profile API v4 (older version) | v4.9 has better support for review reply moderation state tracking |
| Third-party review APIs (Reputation.com, Birdeye) | Too expensive for MVP. R10k+/month vs building direct integration |
| No API — manual dashboard copy/paste | Not viable at scale. Would require human to post replies. |

### Rate Limits / Quotas
Google does not publish specific rate limits for the Business Profile API publicly. Standard Google API quotas apply — approximately 10,000 queries per project per day by default, can be raised via Google Cloud Console. At 6-hour polling intervals with 3 API calls per profile (list reviews + maybe token refresh), this is well within standard limits.

### Polling Interval: Every 6 Hours
| Criterion | 1 hour | 6 hours | 24 hours |
|---|---|---|---|
| Max time before response | 1 hour | 6 hours | 24 hours |
| SLA compliance (24h) | ✅ | ✅ | ✅ |
| API calls/day per profile | 24 | 4 | 1 |
| Quota usage (100 profiles) | 2,400/day | 400/day | 100/day |
| Recommendation | Overkill | ✅ Best balance | May miss same-day urgency |

## Email Provider

### Decision
**Resend** for transactional email (negative review alerts, weekly digest, follow-up reminders).

### Rationale
- Free tier: 100 emails/day — enough for MVP (at ~50 reviews/week + digests)
- `@react-email/components` integration with Next.js
- High deliverability rates
- Simple REST API

### Alternatives Considered
| Alternative | Why not chosen |
|---|---|
| Gmail API (existing OAuth token) | Leroy has this, but it's tied to their personal account. Business emails should come from a product domain (`noreply@reviewcopilot.co.za`). |
| SendGrid | Good but more configuration overhead. Resend is simpler for MVP. |
| Postmark | Better for transactional but requires paid tier ($15/mo minimum) |

## AI Model for Response Generation

### Decision
Use the active Hermes Agent model (`deepseek-ai/deepseek-v4-flash` via Nvidia API) for generating review responses.

### Rationale
- Same model available through this session — consistent quality
- Excellent at short-form natural language (review responses are <200 chars)
- Cost-effective (flash model)
- Can be swapped to any model later

### Prompt Engineering Strategy
The key challenge is preventing AI-sounding responses. The prompt template forces:
1. SA English idiom
2. Varied sentence structure (no two identical patterns)
3. Prohibited words list (Americanisms, British corporate speak)
4. Length limit (~200 chars)
5. Never argue, deny, or excuse (for negative responses)

### Alternatives Considered
- OpenAI GPT-4o: Higher quality but higher cost. Overkill for 200-char responses.
- Claude Haiku: Good alternative. Can swap if DeepSeek quality is inconsistent.
- Ollama local model on VPS zahra: Free but lower quality. Not suitable for customer-facing text.

## Token Refresh Strategy

### Decision
Google Business Profile OAuth refresh tokens expire after approximately 7 days. Implement a background refresh mechanism that:
1. Checks token expiry before each API call
2. Refreshes using the stored refresh token when < 1 hour from expiry
3. If refresh fails, marks the business as `is_active = false` and emails the user to reconnect

### Rationale
Standard Google OAuth behavior for Desktop app credentials. The refresh token remains valid unless the user revokes access, but access tokens expire hourly. The 7-day sign-in requirement means re-auth from the user is occasionally needed.

### Mitigation
- Store refresh tokens encrypted in the database
- Auto-refresh access tokens on every API call if expired
- If refresh fails (refresh token expired), notify user via email to re-connect their GBP
- The user re-authenticates via the OAuth flow — one click, no friction