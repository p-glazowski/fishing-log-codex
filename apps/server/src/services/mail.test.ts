import { afterEach, expect, it, vi } from 'vitest';
import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { sendRecoveryEmail, createMailTransport } from './mail.js';
vi.mock('nodemailer', () => ({ default: { createTransport: vi.fn() } }));
const original = { ...env };
afterEach(() => {
  Object.assign(env, original);
  vi.resetAllMocks();
});
it('uses authenticated STARTTLS and bounded timeouts, with an actual recovery link', async () => {
  Object.assign(env, {
    SMTP_HOST: 'smtp.example.com',
    SMTP_FROM: 'noreply@example.com',
    SMTP_USER: 'sender',
    SMTP_PASSWORD: 'test-only',
    CLIENT_ORIGIN: 'https://app.example.com',
  });
  const sendMail = vi.fn().mockResolvedValue({ accepted: ['angler@example.com'] });
  vi.mocked(nodemailer.createTransport).mockReturnValue({ sendMail } as any);
  const token = 'a'.repeat(64);
  await sendRecoveryEmail('angler@example.com', token);
  expect(nodemailer.createTransport).toHaveBeenCalledWith(
    expect.objectContaining({
      secure: false,
      requireTLS: true,
      auth: { user: 'sender', pass: 'test-only' },
      connectionTimeout: 10000,
      socketTimeout: 20000,
    }),
  );
  expect(sendMail).toHaveBeenCalledWith(
    expect.objectContaining({
      to: 'angler@example.com',
      from: 'noreply@example.com',
      text: expect.stringContaining(`https://app.example.com/reset-password#${token}`),
    }),
  );
});
it('uses implicit TLS on 465 and propagates delivery failures for token invalidation', async () => {
  Object.assign(env, {
    SMTP_HOST: 'smtp.example.com',
    SMTP_FROM: 'noreply@example.com',
    SMTP_PORT: 465,
    SMTP_SECURE: 'true',
  });
  const sendMail = vi.fn().mockRejectedValue(new Error('delivery failed'));
  vi.mocked(nodemailer.createTransport).mockReturnValue({ sendMail } as any);
  await expect(sendRecoveryEmail('angler@example.com', 'b'.repeat(64))).rejects.toThrow(
    'delivery failed',
  );
  expect(nodemailer.createTransport).toHaveBeenCalledWith(
    expect.objectContaining({ secure: true, requireTLS: false }),
  );
});
it('refuses to run SMTP diagnostics without a configured host', () => {
  env.SMTP_HOST = '';
  expect(() => createMailTransport()).toThrow('Configure SMTP_HOST');
  expect(nodemailer.createTransport).not.toHaveBeenCalled();
});
