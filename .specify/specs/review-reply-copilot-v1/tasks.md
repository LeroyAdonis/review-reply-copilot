# Tasks: Review Reply Copilot v1

**Spec:** spec.md
**Plan:** plan.md
**Date:** 2026-07-26

## Phase 1: Project Setup (Days 1-2)

- [ ] T001 Scaffold Next.js 14 App Router project at `/root/review-reply-copilot/`
- [ ] T002 Configure Tailwind CSS + shadcn/ui
- [ ] T003 Set up Drizzle ORM with Neon PostgreSQL — create `/lib/db/index.ts`, `/drizzle.config.ts`
- [ ] T004 Create Drizzle schema at `/lib/db/schema.ts` — tables: users, businesses, reviews, responses, digest_log
- [ ] T005 Generate and apply first migration: `npm run db:generate && npm run db:migrate`
- [ ] T006 Set up NextAuth.js with Google OAuth at `/app/api/auth/[...nextauth]/route.ts`
- [ ] T007 Create sign-in page at `/app/auth/sign-in/page.tsx`
- [ ] T008 [P] Set up Resend account and create email service at `/lib/email/client.ts`
- [ ] T009 [P] Create `.env.example` with all required env vars

**Verification:** `npm run dev` starts. User can sign in with Google. Database tables exist in Neon.

## Phase 2: GBP Integration (Days 3-5)

- [ ] T010 [P] Create GBP OAuth route — `GET /api/businesses/connect` returns Google OAuth URL
- [ ] T011 [P] Create GBP OAuth callback — `GET /api/businesses/callback` exchanges code for tokens
- [ ] T012 Implement GBP account fetch — on connect, fetch user's locations via `accounts.locations.list`
- [ ] T013 [P] Create `POST /api/reviews/check` — calls `reviews.list` for a business, stores new reviews
- [ ] T014 Create business settings page at `/app/dashboard/business/[id]/page.tsx` — tone, type, name
- [ ] T015 [P] Implement token encryption/decryption utility at `/lib/gbp/tokens.ts`
- [ ] T016 Implement token auto-refresh in GBP API client at `/lib/gbp/client.ts`

**Verification:** Connect test GBP → locations appear → reviews fetched and stored in DB.

## Phase 3: AI Responses + Auto-Publish (Days 6-9)

- [ ] T017 [US1] Create AI response generator at `/lib/ai/generate-response.ts` — takes review text, rating, tone, business type → returns response
- [ ] T018 [US1] Create `POST /api/reviews/[id]/publish` — publishes positive review response to Google via `updateReply`
- [ ] T019 [US1] Create review processing pipeline at `/lib/pipeline/process-review.ts` — classify → generate → publish (positive) or draft (negative)
- [ ] T020 [US2] Create email template at `/lib/email/templates/negative-review-alert.tsx` using react-email
- [ ] T021 [US2] Create approval page at `/app/approve/[reviewId]/page.tsx` — mobile-friendly, shows review + suggested response, 3 action buttons (Approve/Edit/Discard)
- [ ] T022 [US2] Create approval API endpoints:
  - `POST /api/reviews/[id]/approve` — publish to Google
  - `POST /api/reviews/[id]/edit` — save edited text + publish
  - `POST /api/reviews/[id]/discard` — mark as discarded
- [ ] T023 [US2] Send email when negative review is detected in the pipeline

**Verification:** Positive review arrives → auto-publishes within next poll cycle. Negative review → email sent with approval link → Approving publishes to Google.

## Phase 4: Dashboard + Weekly Digest (Days 10-12)

- [ ] T024 [US4] Create dashboard layout at `/app/dashboard/page.tsx` — summary card + recent reviews list + pending approvals tab
- [ ] T025 [US1] Create weekly digest email template at `/lib/email/templates/weekly-digest.tsx`
- [ ] T026 Create `POST /api/digest/send` — generates and emails weekly summary
- [ ] T027 [P] Create `GET /api/reviews/export` — CSV export of all reviews + responses for a business
- [ ] T028 Add navigation: settings page at `/app/dashboard/settings/page.tsx`

**Verification:** Dashboard shows connected profiles, reviews, response rate. Weekly digest email arrives.

## Phase 5: Polling + Polish (Days 13-14)

- [ ] T029 Create cron trigger endpoint `POST /api/polling/check` — iterates active businesses, calls process-review pipeline
- [ ] T030 Set up VPS cron job to trigger `/api/polling/check` every 6 hours
- [ ] T031 Add error handling: retry logic for failed API calls, dead letter queue for failed publish attempts
- [ ] T032 Add free-tier gating (R299 tier for >10 reviews/month) — checks review count before processing
- [ ] T033 [P] Create landing page at `/page.tsx` — product description + pricing + "Connect Your Business" CTA
- [ ] T034 [P] Add error monitoring — log failed token refreshes, failed email sends, failed AI generations
- [ ] T035 Final end-to-end test: sign-up → connect GBP → trigger incoming review → verify response

**Verification:** Cron runs every 6h on VPS. New reviews detected and processed automatically. Token refreshes without manual action.

## MVP Scope

**MVP = Phase 1 + Phase 2 + Phase 3 + Phase 5 (cron + polish).** Phase 4 (Dashboard + Digest) is nice-to-have for launch.

The absolute minimum launchable product is:
1. User signs up and connects GBP ✅
2. New reviews are polled and detected ✅
3. Positive auto-replied, negative drafted + emailed ✅
4. User approves/edits via mobile page ✅
5. Everything runs on cron ✅

**Dashboard can ship 2-3 days after launch.** The user doesn't need a dashboard on day 1 — they get email notifications which is more useful for MVP.

## Dependencies

T003 → T004 → T005 (schema must exist before migration)
T006 → T007 (auth route must exist before sign-in page)
T010 → T011 (connect route must exist before callback)
T017 → T018 → T019 (generator → publish endpoint → pipeline)
T020 → T021 → T022 (email template → approval page → approval endpoints)
T022 → T023 (approval endpoints → email sending)
T019 → T029 (pipeline must exist before cron endpoint)

## Parallel Opportunities

- T008 (Resend setup) can run with T009 (env example) and T006 (auth setup)
- T010 (GBP connect) can run with T013 (reviews check)
- T027 (export) can run with T024 (dashboard)
- T033 (landing page) can run with T034 (error monitoring)

## Edge Cases to Handle

1. **Unverified location**: GBP API returns error on `updateReply` for unverified locations. Handle gracefully: mark business as unverified, email user to verify.
2. **Review already replied to**: `updateReply` creates if not exists, updates if exists. No duplicate protection needed — but we should check before generating.
3. **Google moderation rejection**: Response submitted but `reviewReplyState` returns `REJECTED`. Log the policy violation reason and email user.
4. **OAuth token expiry**: Refresh token itself expires (~7 days). User needs to reconnect. Email them.
5. **Rate limit exceeded**: Google returns 429. Exponential backoff + retry.
6. **No reviews on initial connect**: For new businesses with 0 reviews. Show "Waiting for your first review" state on dashboard.
7. **AI generation failure**: If AI API returns error, retry 3 times with exponential backoff. If still failing, mark as requiring manual response and email user.
8. **Multiple businesses, one user**: All polling and processing must be scoped per-business, not per-user.