import { expect, it } from 'vitest';
import { parseEnvironment } from './env.js';
const base = { MONGODB_URI: 'mongodb://localhost/test', JWT_SECRET: 'x'.repeat(48) };
const production = {
  ...base,
  NODE_ENV: 'production',
  CLIENT_ORIGIN: 'https://lurelog.example.com',
  SMTP_HOST: 'smtp.example.com',
  SMTP_USER: 'sender',
  SMTP_PASSWORD: 'test-only-password',
  SMTP_FROM: 'noreply@example.com',
};
it('requires complete SMTP credentials before production starts', () => {
  for (const key of ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASSWORD', 'SMTP_FROM'])
    expect(() => parseEnvironment({ ...production, [key]: '' })).toThrow();
  expect(parseEnvironment(production).SMTP_PORT).toBe(587);
  expect(parseEnvironment(base).SMTP_HOST).toBeUndefined();
});
it('rejects incorrect TLS settings and partial authentication', () => {
  expect(() => parseEnvironment({ ...production, SMTP_PORT: 465 })).toThrow('SMTP_SECURE');
  expect(parseEnvironment({ ...production, SMTP_PORT: 465, SMTP_SECURE: 'true' }).SMTP_SECURE).toBe(
    'true',
  );
  expect(() => parseEnvironment({ ...production, SMTP_SECURE: 'true' })).toThrow('SMTP_SECURE');
  expect(() => parseEnvironment({ ...base, SMTP_USER: 'sender' })).toThrow('together');
  expect(() => parseEnvironment({ ...production, SMTP_FROM: 'not an email' })).toThrow();
});
it('normalizes origins and rejects insecure production or misleading configuration', () => {
  expect(
    parseEnvironment({ ...production, CLIENT_ORIGIN: 'https://lurelog.example.com/' })
      .CLIENT_ORIGIN,
  ).toBe('https://lurelog.example.com');
  for (const origin of [
    'http://lurelog.example.com',
    'https://lurelog.example.com/path',
    'https://lurelog.example.com?test=1',
    'https://user:pass@lurelog.example.com',
    'ftp://lurelog.example.com',
  ])
    expect(() => parseEnvironment({ ...production, CLIENT_ORIGIN: origin })).toThrow();
  expect(() =>
    parseEnvironment({ ...production, JWT_SECRET: 'replace-with-at-least-32-random-characters' }),
  ).toThrow('random secret');
  expect(() => parseEnvironment({ ...production, STORAGE_PROVIDER: 'cloudinary' })).toThrow(
    'Cloudinary',
  );
});
