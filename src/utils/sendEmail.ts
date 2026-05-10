import { Resend } from 'resend';
import type { Env } from '../config/env.js';

export type EmailPayload = { email: string; subject: string; message: string };

export async function sendEmail(
  env: Env,
  options: EmailPayload,
): Promise<void> {
  const resend = new Resend(env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: 'E-shop App <onboarding@resend.dev>',
    to: [options.email],
    subject: options.subject,
    text: options.message,
  });

  if (error) {
    throw new Error(error.message);
  }
}
