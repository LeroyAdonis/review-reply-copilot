# Quickstart: Review Reply Copilot v1

**Spec:** spec.md
**Plan:** plan.md
**Date:** 2026-07-26

## Prerequisites

- Node.js 18+
- Vercel account
- Neon PostgreSQL database (free tier)
- Google Cloud Project with Business Profile API enabled
- Resend account (free tier — 100 emails/day)
- VPS zahra for cron jobs
- DeepSeek V4 Flash access via Nvidia API (already configured in Hermes)

## Local Dev Setup

```bash
cd /root/review-reply-copilot
cp .env.example .env.local
npm install
npm run db:migrate
npm run dev
```

## End-to-End Validation

### 1. Sign-up Flow
1. Open `http://localhost:3000`
2. Click "Sign in with Google"
3. Verify: redirected to dashboard with "Connect Your Google Business Profile" prompt

### 2. Connect GBP
1. Click "Connect Google Business Profile"
2. Complete Google OAuth consent (requires `business.manage` scope)
3. Verify: business appears in dashboard with name and location

### 3. Configure Tone
1. Select business type (e.g. "Clinic") from dropdown
2. Select tone ("Warm & Casual")
3. Save
4. Verify: settings persist on page reload

### 4. Simulate Incoming Review (Manual Test)
```bash
# Fetch current reviews
curl -H "Authorization: Bearer $(npm run get-token)" \
  http://localhost:3000/api/reviews

# Check if any positive reviews exist (4-5★) — they should have auto-generated responses
# Check if any negative reviews exist (1-3★) — they should have drafts + email sent
```

### 5. Approve Negative Review
1. Check inbox for negative review alert email
2. Click "Approve" link in email
3. Verify: redirects to approval page showing review + response
4. Click "Approve" button
5. Verify: response published, email confirmation

### 6. Weekly Digest
1. Wait for Monday 8:00 SAST or trigger manually:
   ```bash
   curl -X POST http://localhost:3000/api/digest/send \
     -H "Authorization: Bearer CRON_SECRET"
   ```

### 7. Cron Polling (on VPS zahra)
```bash
# Verify cron triggers correctly:
curl -X POST https://reviewcopilot.vercel.app/api/polling/check \
  -H "Authorization: Bearer CRON_SECRET"

# Check logs for processed reviews
```

## Rollback Plan

If a bug is found post-deploy:
```bash
git checkout HEAD~1
git push -f origin main
# Vercel auto-deploys
```

If the AI response quality is poor:
- Update the prompt template in `/lib/ai/prompts.ts`
- No code change needed — just the prompt
- Re-deploy

If Google API changes break integration:
- The GBP API client is isolated in `/lib/gbp/client.ts`
- Swap to a new version by updating the base URL and request format

## Monitoring

| Signal | Where to look | Action |
|---|---|---|
| Failed response publish | Logs → `/var/log/review-copilot/errors.log` | Retry or manual publish |
| Token refresh failure | User email notification | Ask user to reconnect GBP |
| AI generation failure | Logs → check `POST /api/reviews/[id]/process` response | Retry or fall back to template |
| Email delivery failure | Resend dashboard | Check domain verification, retry |
| Polling cron missed | VPS logs → `crontab -l` → `grep polling /var/log/syslog` | Restart cron service |