import { Resend } from 'resend';

const MILESTONES: Record<number, { subject: string; text: string }> = {
  50: {
    subject: '🎉 discover.gh — 50 saves!',
    text: "You've saved 50 repos on discover.gh. Nice streak!",
  },
  100: {
    subject: '💯 discover.gh — 100 saves!',
    text: "100 repos saved on discover.gh. Keep going!",
  },
  250: {
    subject: '🚀 discover.gh — 250 saves!',
    text: "250 repos saved on discover.gh. You're halfway to the limit.",
  },
  500: {
    subject: '⚠️ discover.gh — Limit reached (500/500)',
    text: "You've saved 500 repos on discover.gh. That's the limit!\n\nReview your saves in the Google Sheet or clear some to continue saving.",
  },
};

export async function sendMilestoneEmail(count: number): Promise<void> {
  const msg = MILESTONES[count];
  if (!msg) return;
  const resend = new Resend(process.env.RESEND_API_KEY!);
  await resend.emails.send({
    from: 'discover.gh <onboarding@resend.dev>',
    to: process.env.ALERT_EMAIL!,
    subject: msg.subject,
    text: msg.text,
  });
}
