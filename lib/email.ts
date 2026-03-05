import { Resend } from 'resend';

export async function sendSaveLimitEmail(): Promise<void> {
  const resend = new Resend(process.env.RESEND_API_KEY!);
  await resend.emails.send({
    from: 'discover.gh <onboarding@resend.dev>',
    to: process.env.ALERT_EMAIL!,
    subject: '⚠️ discover.gh — Save limit reached (500/500)',
    text: "You've saved 500 repos on discover.gh. That's the limit!\n\nYou can review your saves in the Google Sheet or clear some to continue saving.",
  });
}
