import { Resend } from "resend";

const FROM_EMAIL = "noreply@reviewcopilot.co.za";

function getClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not set");
  return new Resend(apiKey);
}

export async function sendNegativeReviewAlert(
  to: string,
  reviewText: string,
  suggestedReply: string,
  reviewId: string
): Promise<void> {
  const resend = getClient();

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: "⚠️ New review needs your attention",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">New review requires your approval</h2>
        <p>A customer left a review that needs a thoughtful response:</p>
        <blockquote style="border-left: 3px solid #e5e7eb; padding-left: 16px; margin: 16px 0; color: #6b7280;">
          ${reviewText}
        </blockquote>
        <p><strong>Suggested reply:</strong></p>
        <p style="background: #f9fafb; padding: 12px; border-radius: 6px;">${suggestedReply}</p>
        <p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/dashboard/reviews/${reviewId}"
             style="display: inline-block; background: #2563eb; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none;">
            Review & Approve
          </a>
        </p>
        <p style="font-size: 12px; color: #9ca3af;">Review Reply Copilot</p>
      </div>
    `,
  });

  if (error) {
    throw new Error(`Failed to send negative review alert: ${error.message}`);
  }
}

export async function sendWeeklyDigest(
  to: string,
  summary: {
    totalReviews: number;
    positiveCount: number;
    negativeCount: number;
    pendingApproval: number;
    avgRating: number;
  }
): Promise<void> {
  const resend = getClient();

  const ratingDisplay = summary.avgRating > 0
    ? `${(summary.avgRating / 10).toFixed(1)}★`
    : "N/A";

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `📊 Weekly Review Digest — ${summary.totalReviews} reviews this week`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Weekly Review Digest</h2>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">Total Reviews</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">${summary.totalReviews}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">Positive (4-5★)</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; color: #16a34a;">${summary.positiveCount}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">Negative (1-3★)</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; color: #dc2626;">${summary.negativeCount}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">Pending Approval</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; color: #d97706;">${summary.pendingApproval}</td>
          </tr>
          <tr>
            <td style="padding: 8px;">Average Rating</td>
            <td style="padding: 8px; font-weight: bold;">${ratingDisplay}</td>
          </tr>
        </table>
        <p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/dashboard"
             style="display: inline-block; background: #2563eb; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none;">
            View Dashboard
          </a>
        </p>
        <p style="font-size: 12px; color: #9ca3af;">Review Reply Copilot</p>
      </div>
    `,
  });

  if (error) {
    throw new Error(`Failed to send weekly digest: ${error.message}`);
  }
}

export async function sendFollowUpReminder(
  to: string,
  reviewId: string
): Promise<void> {
  const resend = getClient();

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: "🔔 Don't forget to respond to this review",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Follow-Up Reminder</h2>
        <p>You have a review that hasn't received a response yet. Timely replies show customers you care.</p>
        <p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/dashboard/reviews/${reviewId}"
             style="display: inline-block; background: #2563eb; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none;">
            Reply Now
          </a>
        </p>
        <p style="font-size: 12px; color: #9ca3af;">Review Reply Copilot</p>
      </div>
    `,
  });

  if (error) {
    throw new Error(`Failed to send follow-up reminder: ${error.message}`);
  }
}
