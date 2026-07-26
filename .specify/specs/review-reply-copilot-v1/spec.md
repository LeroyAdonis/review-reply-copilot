# Feature Spec: Review Reply Copilot v1

**Date:** 2026-07-26
**Constitution:** ../../.specify/memory/constitution.md
**Status:** Clarified

## Vision Statement

A business owner connects their Google Business Profile once, picks their tone, and never thinks about replying to reviews again. The tool handles every positive review automatically in their own South African voice, and nudges them via WhatsApp when a negative review needs a personal touch. It feels like having a polite, responsive front-desk person who never sleeps, never gets defensive, and never forgets to say "thank you."

## User Scenarios

### Scenario 1: The Salon Owner (Core — Set-and-Forget)
**As a** salon owner in Joburg with 30+ reviews
**I want to** connect my Google Business Profile once and have every new positive review answered within 24 hours in my voice
**So that** my Google ranking improves, potential customers see an engaged business, and I don't spend 20 minutes every morning replying to reviews

**Acceptance criteria:**
- [ ] User can connect a Google Business Profile via a one-time OAuth flow (no more than 3 clicks from landing page)
- [ ] After connection, new 4-5 star reviews are replied to automatically within 24 hours
- [ ] Replies use SA English idiom, not American/British corporate speak
- [ ] No two replies on the same profile use identical sentence structure — varied enough to look human
- [ ] User receives a weekly digest email showing all reviews replied to that week
- [ ] User can disconnect their Google Business Profile at any time and all auto-replying stops immediately

### Scenario 2: The Clinic Manager (Negative Review Handling)
**As a** clinic manager who just received a 2-star review complaining about wait times
**I want to** get an email with a suggested draft response that I can approve or edit with one click
**So that** I respond thoughtfully to unhappy patients without spending 15 minutes stressing about what to write

**Acceptance criteria:**
- [ ] When a 1-3 star review comes in, a suggested reply is drafted within 1 hour but NOT auto-published
- [ ] User receives an email containing the review text and a suggested reply with an approve/edit link
- [ ] Clicking "Approve" in the email navigates to a confirmation page — one more click publishes the response
- [ ] Clicking "Edit" navigates to an edit page where the user can revise before confirming
- [ ] If user does not respond within 48 hours, a follow-up reminder email is sent
- [ ] The suggested reply acknowledges the specific complaint (not generic "sorry you had a bad experience") and offers a constructive next step
- [ ] No suggested reply ever argues with the customer, denies the complaint, or makes excuses

### Scenario 3: The Tradesman (First-Time Setup)
**As a** plumber with 5 Google reviews who has never replied to any
**I want to** set up the tool in under 5 minutes and see my past reviews get retroactive replies
**So that** my Google profile immediately looks active and engaged when new customers check me out

**Acceptance criteria:**
- [ ] Setup flow takes under 5 minutes from sign-up to first auto-reply
- [ ] User selects their business type from a short list (salon, clinic, tradesman, restaurant, other) which informs the tone
- [ ] User selects their preferred tone: "Professional", "Warm & Casual", or "Short & Sweet"
- [ ] [NEEDS CLARIFICATION: Only new reviews from connection onward. No retroactive replies to existing reviews.]
- Since the polling interval will be determined during planning, it directly affects this. We'll define the exact polling rate after checking Google Business Profile API rate limits and quota costs.
- [ ] After setup, user sees a confirmation screen showing their connected profile and a sample auto-reply

### Scenario 4: The Multi-Location Manager (Dashboard)
**As a** business owner with 2 locations across Cape Town
**I want to** see all my locations' reviews and responses in one dashboard
**So that** I can keep track of sentiment trends across my business

**Acceptance criteria:**
- [ ] User can connect multiple Google Business Profiles under one account
- [ ] Dashboard shows a summary: total reviews, average rating, response rate, sentiment trend (improving/declining)
- [ ] Dashboard is readable on mobile (most users will check on their phone)
- [ ] Dashboard is NOT required for the product to function — it's a checking-in tool, not a daily-use tool

### Scenario 5: The Free-Tier Trial User
**As a** new user who is unsure if this is worth it
**I want to** try it free for the first month with my 5-10 reviews
**So that** I can see the quality of responses before paying

**Acceptance criteria:**
- [ ] Free tier supports businesses with up to 10 reviews/month at no cost
- [ ] Free tier has the same features as paid (no degraded response quality)
- [ ] Free tier shows a subtle upgrade prompt when approaching the 10-review limit
- [ ] No credit card required to sign up for free tier

## Functional Requirements

### FR-1: Google Business Profile Integration
The system connects to the user's Google Business Profile to read incoming reviews and publish responses on their behalf. The connection persists across sessions without requiring re-authentication.

### FR-2: Review Monitoring
The system checks for new reviews on a regular interval. The polling frequency will be determined during planning after checking Google Business Profile API rate limits and quota costs. Each new review is classified as positive (4-5 stars) or negative (1-3 stars).

### FR-3: Response Generation
The system generates a response for each review tailored to the review's content, the business type, and the user's selected tone. Responses for positive reviews are published automatically. Responses for negative reviews are held as drafts.

### FR-4: Email Notification for Negative Reviews
When a negative review draft is generated, the system sends an email to the registered email address containing the review text, the suggested response, and a link to a mobile-friendly approval page where the user can Approve (one click to publish), Edit (shows editable text then publish), or Discard with a single tap.

### FR-5: Weekly Digest
The system sends a weekly email summarizing all reviews received, responses published, drafts pending approval, and any sentiment trends.

### FR-6: Multi-Business Support
A single user account can manage multiple Google Business Profiles. Each profile has its own tone settings and review history.

### FR-7: Self-Serve Sign-Up
Users can sign up, connect their Google Business Profile, configure tone, and start receiving auto-replies without any human intervention from the product team.

### FR-8: Export
Users can export all their review data and response history at any time in a standard format.

## Non-Functional Requirements

### NFR-1: Performance
- Review detection to response published: < 24 hours for positive reviews
- WhatsApp notification for negative reviews: < 1 hour after detection
- Dashboard load: < 2 seconds on mobile 3G
- Weekly digest email sent: every Monday at 8:00 SAST

### NFR-2: Reliability
- If the review monitoring service is down, it resumes on restart without missing reviews
- If response generation fails for a specific review, it retries 3 times before alerting the user
- If email delivery fails for negative review notification, retry after 1 hour

### NFR-3: Security
- Google OAuth tokens stored encrypted, never logged
- No review content or response text is stored in plaintext logs
- User phone number stored only for WhatsApp notifications, never shared

### NFR-4: Accessibility
- Dashboard is keyboard navigable
- Sign-up flow works on mobile Chrome and Safari (most SA users are mobile-first)

## Key Entities

- **Businesses** have one Google Business Profile each, a tone setting, and a business type
- **Users** have one account, one phone number, one email, and can manage multiple Businesses
- **Reviews** belong to a Business, have a star rating, review text, author name, and date
- **Responses** belong to a Review, have response text, status (auto-published / draft / approved / edited / discarded), and timestamp

## Visual/UX Direction

The product should feel **light, clean, and calm** — the opposite of a dashboard-heavy SaaS. The emotional goal: the user opens it, sees everything is handled, and closes it. It's a "peace of mind" tool, not a "log in and work" tool.

**Sign-up flow:** 3 steps max. Step 1: Google sign-in. Step 2: Pick your business type + tone. Step 3: "You're all set" confirmation with a sample reply. The entire flow should feel like connecting a smart home device — effortless and automatic.

**Dashboard:** Minimal. A summary card at top (reviews this month, response rate, average rating). A scrollable list of recent reviews with their responses. A tab for "Pending your approval" showing negative review drafts. Nothing more — no charts, no funnels, no configuration menus. The dashboard is a glance, not a workspace.

**WhatsApp interaction:** Short, friendly messages. "You got a review 🌟" for positive, "A review needs your attention ⚠️" for negative. The suggested reply is formatted in quotes so it's easy to scan. Reply options are "1=Approve, 2=Edit, 3=Skip" — no long instructions needed.

**Colour palette:** Clean white or very light grey background. Trust-evoking accent colour (not red, not aggressive — think teal or soft blue). Status indicators: green dot for auto-published, amber dot for pending approval, grey for skipped.

## Assumptions

- Target businesses have a Google Business Profile already set up (if not, they're too early-stage for this tool)
- Google's Business Profile API allows reading reviews and writing responses programmatically (need to verify API access level during planning phase)
- WhatsApp Business API is available for sending notifications (may require Meta Business verification)
- SA business owners have smartphones and use WhatsApp daily
- Review volume for target customers: 1-20 reviews/month (not high-volume review businesses like restaurants with hundreds)

## Out of Scope (v1)

- **Competitor review monitoring** — this is about your own reviews, not comparing with competitors
- **Review generation** — asking customers for reviews, sending review request links, QR codes. This is a different product.
- **Multi-language support** — v1 is English only. Afrikaans/Zulu/Xhosa support is a future feature.
- **Facebook/Trustpilot/Yelp reviews** — v1 is Google Business Profile only. Other platforms are integration candidates for v2.
- **Response analytics/A/B testing** — measuring which response styles get better engagement. Future premium feature.
- **Team collaboration** — multiple users managing one business's reviews. v1 is single-user per account.
- **Automated escalation for crisis reviews** — detecting patterns like viral negative reviews. Future feature.
- **Invoice/billing management UI** — using Stripe checkout links. No need for a billing dashboard in the product.
