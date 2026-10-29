import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

export async function sendRecoveryEmail(email: string, token: string) {
  const url = new URL('/reset-password', env.CLIENT_ORIGIN);
  url.hash = token;
  const message = `Use this link within 30 minutes to reset your LureLog password:\n\n${url}\n\nIf you did not request this, you can ignore this email.`;
  if (env.NODE_ENV !== 'production' && !env.SMTP_HOST) {
    const dir = path.resolve(env.UPLOAD_DIR, 'dev-mail');
    await mkdir(dir, { recursive: true, mode: 0o700 });
    await writeFile(
      path.join(dir, `reset-${Date.now()}-${token.slice(0, 8)}.txt`),
      `To: ${email}\n\n${message}\n`,
      { mode: 0o600 },
    );
    return;
  }
  if (!env.SMTP_HOST || !env.SMTP_FROM)
    throw new Error('SMTP_HOST and SMTP_FROM must be configured');
  const transport = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE === 'true',
    requireTLS: !(env.SMTP_SECURE === 'true'),
    ...(env.SMTP_USER ? { auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD } } : {}),
  });
  await transport.sendMail({
    from: env.SMTP_FROM,
    to: email,
    subject: 'Reset your LureLog password',
    text: message,
  });
}
