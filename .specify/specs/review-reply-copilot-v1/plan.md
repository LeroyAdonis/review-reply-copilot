# Implementation Plan: Review Reply Copilot v1

**Spec:** ../specs/review-reply-copilot-v1/spec.md
**Constitution:** ../../.specify/memory/constitution.md
**Date:** 2026-07-26

## Technical Context

| Dimension | Decision | Rationale |
|---|---|---|
| Frontend | Next.js 14+ App Router | Fast to scaffold, serverless deploy to Vercel. You're experienced with it. |
| Styling | Tailwind CSS + shadcn/ui components | Minimum UI (dashboard + approval pages). shadcn gives professional look fast. |
| Database | PostgreSQL via Neon (serverless) | Free tier, Drizzle ORM. Already in your stack for KitFix. |
| Auth | Google OAuth (the user's Google sign-in to connect Business Profile) + next-auth or Better Auth for the app itself | User authenticates to the app, then separately connects their Google Business Profile via the `business.manage` OAuth scope. |
| Email | Resend (for transactional) + simple SendGrid/Resend API | You already have Google OAuth email access (`~/.hermes/google_token.json`), but Resend is simpler for transactional email. Gmail API also works. |
| AI | DeepSeek V4 Flash via Nvidia (current model) | Generate review responses. Fits the budget model for AI ops since review responses are short (<300 chars). The model available today is used. |
| Deploy | Vercel (app) + cron job on VPS zahra (review polling) | The app itself is Next.js on Vercel. Review polling needs a persistent cron service — VPS zahra handles this via a simple script. |
| Integrations | Google Business Profile API v4.9 | Official API for reading reviews and updating replies. OAuth scope: `https://www.googleapis.com/auth/business.manage` |
| Polling interval | Every 6 hours (4 polls/day per connected profile) | Google doesn't publish strict rate limits but typically enforces per-project quotas. 6-hour polling keeps 24-hour response SLA easily met and stays well within quota. Can increase later if needed. |

## Constitution Check

| Principle | Status | Notes |
|---|---|---|
| 1. Always-On, Never Silent | ✅ Compliant | Polling every 6 hours + cron on VPS ensures 24-hour SLA. No manual action needed for positive reviews. |
| 2. SA Voice, Not Generic AI | ✅ Compliant | The AI prompt (see Research Summary) explicitly enforces SA English idiom and varied sentence structure. Response generation uses `deepseek-ai/deepseek-v4-flash` which produces natural SA English. |
| 3. Set-and-Forget First | ✅ Compliant | Dashboard is optional. Primary workflow: connect → choose tone → walk away. Email digest keeps user informed without requiring login. |
| 4. Negative Reviews Get Human-Grade Care | ✅ Compliant | 1-3 star reviews are drafted but NOT auto-published. User receives email with Approve/Edit/Discard link. Follow-up reminder after 48h. |
| 5. Data Belongs to the Business | ✅ Compliant | Export feature via dashboard. Reviews remain on Google regardless — the app just manages responses. |
| 6. Ship in 14 Days or Cut Scope | ✅ Compliant | MVP scope below fits in 14 days. Phase 3-5 (multi-location, export) are post-MVP can be deferred. |
| 7. Founder-Friendly Pricing in Rands | ✅ Compliant | Free tier (≤10 reviews/mo) + R299 Starter + R699 Pro. No enterprise sales. Self-serve signup. |

## Research Summary

### Google Business Profile API — Key Findings

| Item | Finding |
|---|---|
| List reviews | `GET https://mybusiness.googleapis.com/v4/{parent}/reviews` — returns paginated list, max pageSize 50 |
| Update reply | `PUT https://mybusiness.googleapis.com/v4/{name}/reply` — creates or updates reply on a review |
| Get single review | `GET https://mybusiness.googleapis.com/v4/{name}` |
| OAuth scope | `https://www.googleapis.com/auth/business.manage` |
| API version | v4.9 (latest stable) |
| Rate limits | Publicly undocumented. Standard Google API quotas apply (per-project, can be raised). 6-hour polling keeps well within limits. |
| Location verified requirement | Only verified location owners can write replies. The API returns errors for unverified locations. |
| Reply max length | 4096 bytes per ReviewReply.comment field |
| Moderation | Replies go through Google moderation (PENDING → APPROVED or REJECTED). The `reviewReplyState` field shows current status. |

### OAuth Implementation

- **App auth**: NextAuth.js / Better Auth for user login (Google OAuth — reuses credentials from `~/.hermes/google_credentials.json`)
- **GBP auth**: Separate OAuth flow for the `business.manage` scope. User clicks "Connect Google Business Profile" → Google consent screen → token stored encrypted. This is a second OAuth flow on top of app auth.
- **Token storage**: Google OAuth tokens (refresh + access) stored in the database, encrypted at rest. `business.manage` tokens expire after ~7 days (like other Google OAuth tokens) — a background cron job refreshes them.

### AI Response Generation Prompt

The prompt for generating responses must enforce:

```
You are generating a review response for a South African business owner.
- Use SA English idiom ("Thanks for taking the time")
- Vary sentence structure — NO two responses should read identically
- NEVER use Americanisms ("y'all", "reach out to our team")
- NEVER use British corporate speak ("We endeavour to")
- Keep responses under 200 characters
- For positive reviews: warm, grateful, personal
- For negative reviews: acknowledge the specific complaint, offer constructive next step, NEVER argue or make excuses
```

### Email Provider Decision

Using **Resend** for transactional email (negative review alerts, weekly digest). Rationale:
- Simple API, Next.js has `@react-email/components` for styled emails
- Free tier covers 100 emails/day which is plenty for MVP (at 10 negative reviews/week + digests)
- Alternatively, Gmail API via Leroy's existing OAuth token — but Resend has better deliverability

## Data Model

### Tables

#### `users`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| email | text | Unique, used for notifications |
| name | text | From Google OAuth |
| created_at | timestamp | |
| updated_at | timestamp | |

#### `businesses`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | FK → users.id |
| google_location_name | text | e.g. `accounts/{id}/locations/{id}` |
| business_name | text | Display name |
| business_type | text | salon, clinic, tradesman, restaurant, other |
| tone | text | professional, warm_casual, short_sweet |
| gbp_access_token | text | Encrypted |
| gbp_refresh_token | text | Encrypted |
| gbp_token_expires_at | timestamp | For auto-refresh |
| is_active | boolean | |
| created_at | timestamp | |
| updated_at | timestamp | |

#### `reviews`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| business_id | uuid | FK → businesses.id |
| google_review_id | text | Unique per location |
| reviewer_name | text | |
| star_rating | integer | 1-5 |
| comment | text | Review text |
| review_created_at | timestamp | When the customer wrote it |
| detected_at | timestamp | When we first saw it |
| created_at | timestamp | |

#### `responses`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| review_id | uuid | FK → reviews.id |
| status | text | draft, approved, published, edited, discarded |
| suggested_text | text | AI-generated draft |
| final_text | text | What was actually published (may differ if user edited) |
| google_moderation_state | text | PENDING, APPROVED, REJECTED |
| notified_at | timestamp | When email was sent for approval |
| approved_at | timestamp | When user approved |
| published_at | timestamp | When published to Google |
| created_at | timestamp | |
| updated_at | timestamp | |

#### `digest_log`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | FK → users.id |
| sent_at | timestamp | |
| total_reviews | integer | |
| positive_count | integer | |
| negative_count | integer | |
| pending_approval | integer | |
| avg_rating | numeric | |

## API Contracts

### Internal API (Next.js routes)

| Route | Method | Purpose | Notes |
|---|---|---|---|
| `/api/auth/[...nextauth]` | * | App auth (Google OAuth) | NextAuth handles this |
| `/api/businesses/connect` | POST | Initiate GBP OAuth flow | Returns Google OAuth URL |
| `/api/businesses/callback` | GET | GBP OAuth callback | Exchange code for tokens |
| `/api/businesses` | GET | List user's connected businesses | |
| `/api/businesses/[id]` | GET/PUT | Get/update business config | Tone, type |
| `/api/businesses/[id]/disconnect` | POST | Remove GBP connection | |
| `/api/reviews` | GET | List reviews for user's businesses | Filterable by status, date |
| `/api/reviews/[id]/approve` | POST | Approve negative review draft | Publishes to Google |
| `/api/reviews/[id]/edit` | POST | Edit and publish response | User provides revised text |
| `/api/reviews/[id]/discard` | POST | Discard draft | |
| `/api/reviews/export` | GET | Export review + response history | CSV format |
| `/api/digest` | GET | Dashboard summary data | Reviews count, response rate, sentiment |
| `/api/polling/check` | POST | Cron trigger — check for new reviews | Called by VPS cron job |

### External API (Google Business Profile)

| Operation | Method | URL | Notes |
|---|---|---|---|
| List reviews | GET | `https://mybusiness.googleapis.com/v4/{parent}/reviews?pageSize=50&orderBy=updateTime desc` | Max 50 per page, paginate with pageToken |
| Get single review | GET | `https://mybusiness.googleapis.com/v4/{name}` | Rarely needed; list covers it |
| Update reply | PUT | `https://mybusiness.googleapis.com/v4/{name}/reply` | Body: `{ "comment": "response text" }` |

### Email Templates

| Template | Trigger | Sender | Notes |
|---|---|---|---|
| Negative review alert | New 1-3 star review detected | `noreply@reviewcopilot.co.za` | Contains review text, suggested reply, Approve/Edit/Discard links |
| Weekly digest | Every Monday 8:00 SAST | `noreply@reviewcopilot.co.za` | Summary of week's activity |
| Follow-up reminder | 48h after negative alert with no action | `noreply@reviewcopilot.co.za` | "You still have a pending review response..." |

## Implementation Phases

### Phase 1: Project Setup (Days 1-2)
**Goal:** Bootable Next.js app with auth, database, and GBP OAuth flow

- [ ] Scaffold Next.js 14 App Router project with `create-next-app`
- [ ] Set up Drizzle ORM with Neon PostgreSQL
- [ ] Set up NextAuth.js with Google OAuth (app auth)
- [ ] Create database tables (users, businesses, reviews, responses, digest_log)
- [ ] Write Drizzle schema and run first migration
- [ ] Set up shadcn/ui + Tailwind
- [ ] Set up Resend account and configure email
- **Verification:** `npm run dev` starts, user can sign in with Google, database tables exist in Neon

### Phase 2: GBP Integration (Days 3-5)
**Goal:** Connect Google Business Profiles and fetch reviews

- [ ] Implement GBP OAuth flow (connect button → OAuth URL → callback → store tokens)
- [ ] Implement `accounts.locations.list` to fetch user's business locations on connect
- [ ] Implement `reviews.list` for fetching reviews from a location
- [ ] Store reviews in the database (dedup by google_review_id)
- [ ] Classify reviews as positive (4-5★) or negative (1-3★)
- **Verification:** Connect a test GBP account → see 10-20 reviews appear in the database with correct star ratings

### Phase 3: AI Response Generation + Auto-Publish (Days 6-9)
**Goal:** Positive reviews auto-replied, negative reviews drafted and emailed

- [ ] Implement AI response generation for positive reviews using DeepSeek
- [ ] Auto-publish positive review responses to Google via `updateReply` API
- [ ] Track Google moderation state (PENDING → APPROVED)
- [ ] Implement AI draft for negative reviews (don't publish — hold as draft)
- [ ] Set up Resend email for negative review alerts with Approve/Edit/Discard links
- [ ] Build the mobile-friendly approval page (/approve/[reviewId])
- **Verification:** New positive review arrives → response auto-publishes within 6 hours. New negative review → email sent with draft + approval links.

### Phase 4: Dashboard + Weekly Digest (Days 10-12)
**Goal:** User can see their review activity and gets a weekly summary

- [ ] Build minimal dashboard (summary card + review list + pending approvals tab)
- [ ] Implement weekly digest cron job (runs Monday 8:00 SAST on VPS zahra)
- [ ] Implement review export (CSV)
- **Verification:** Dashboard shows connected profiles, reviews, response rate. Email received on Monday with week's summary.

### Phase 5: Polling Cron + Polish (Days 13-14)
**Goal:** Production-ready with reliable polling

- [ ] Set up VPS cron job to hit `/api/polling/check` every 6 hours
- [ ] Implement token refresh logic (GBP OAuth tokens expire ~7 days)
- [ ] Add error handling: retry on failed response publish, retry on failed email
- [ ] Add setup flow for first-time users (business type + tone selection)
- [ ] Final QA: end-to-end flow from sign-up to auto-response
- **Verification:** Cron job runs on VPS. New reviews detected within 6 hours. Token refreshes without manual intervention.

### Post-MVP (Phase 3-5 from spec — defer after launch)
- Multi-location dashboard (Scenario 4)
- Free-tier user management (Scenario 5)
- Response history/analytics
- Reply-with-email flow (replying to the notification email to approve)

## Quickstart

### Prerequisites
- Node.js 18+, Vercel account, Neon PostgreSQL database
- Google Cloud Project with Business Profile API enabled
- Resend account (free tier)
- VPS zahra for cron jobs

### Setup
```bash
# Clone and install
git clone ... && cd review-reply-copilot
cp .env.example .env.local
npm install

# Set up env vars
# Database:
DATABASE_URL=postgres://...
# Google OAuth (app):
AUTH_GOOGLE_ID=xxx
AUTH_GOOGLE_SECRET=xxx
# Google OAuth (GBP business.manage scope):
GBP_CLIENT_ID=xxx
GBP_CLIENT_SECRET=xxx
# Resend:
RESEND_API_KEY=xxx
# AI:
AI_MODEL=deepseek-ai/deepseek-v4-flash
AI_API_KEY=xxx
AI_BASE_URL=https://api.nvidia.com/v1
# App:
NEXTAUTH_SECRET=xxx
NEXTAUTH_URL=http://localhost:3000

# Migrate DB
npm run db:migrate

# Start dev
npm run dev
```

### Verification Flow
1. Open `http://localhost:3000` → sign in with Google
2. Click "Connect Google Business Profile" → OAuth flow
3. Select your business (automatic if only one)
4. Choose business type (e.g. "Clinic") and tone (e.g. "Warm & Casual")
5. New reviews are detected within 6 hours → positive auto-replied, negative emailed
6. Dashboard shows all reviews and response stats
7. Weekly digest arrives Monday 8:00 SAST

### Cron Setup (VPS zahra)
```bash
# Every 6 hours, check for new reviews
echo "0 */6 * * * curl -X POST https://reviewcopilot.vercel.app/api/polling/check -H 'Authorization: Bearer CRON_SECRET'" | crontab -
```

## Out of Scope (Post-MVP)
- Multiple users per business (team accounts)
- Review request campaigns (asking customers to leave reviews)
- Facebook/Trustpilot integration
- Response analytics / A/B testing
- Automated crisis detection
- Android/iOS apps