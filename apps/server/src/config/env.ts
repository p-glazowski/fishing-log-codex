import { z } from 'zod';
export const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  CLIENT_ORIGIN: z.url().default('http://localhost:5173'),
  MONGODB_URI: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  SMTP_HOST: z.string().trim().min(1).optional().or(z.literal('')),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_SECURE: z.enum(['true', 'false']).default('false'),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.email().optional().or(z.literal('')),
  STORAGE_PROVIDER: z.enum(['local', 'cloudinary']).default('local'),
  UPLOAD_DIR: z.string().default('./uploads'),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
});
export function parseEnvironment(input: Record<string, unknown>) {
  const result = environmentSchema.parse(input);
  const origin = new URL(result.CLIENT_ORIGIN);
  if (
    !['http:', 'https:'].includes(origin.protocol) ||
    origin.username ||
    origin.password ||
    origin.search ||
    origin.hash ||
    origin.pathname !== '/'
  )
    throw new Error(
      'CLIENT_ORIGIN must be an HTTP(S) origin without a path, credentials, query or fragment',
    );
  result.CLIENT_ORIGIN = origin.origin;
  if (
    result.STORAGE_PROVIDER === 'cloudinary' &&
    (!result.CLOUDINARY_CLOUD_NAME || !result.CLOUDINARY_API_KEY || !result.CLOUDINARY_API_SECRET)
  )
    throw new Error('Cloudinary configuration is incomplete');
  if (Boolean(result.SMTP_USER) !== Boolean(result.SMTP_PASSWORD))
    throw new Error('SMTP_USER and SMTP_PASSWORD must be configured together');
  if (result.SMTP_HOST && !result.SMTP_FROM)
    throw new Error('SMTP_FROM must be a verified sender email address');
  if (
    result.SMTP_HOST &&
    ((result.SMTP_PORT === 465 && result.SMTP_SECURE !== 'true') ||
      (result.SMTP_PORT === 587 && result.SMTP_SECURE !== 'false'))
  )
    throw new Error('Use SMTP_SECURE=true on port 465, or false on port 587 (STARTTLS)');
  if (result.NODE_ENV === 'production') {
    if (origin.protocol !== 'https:') throw new Error('Production CLIENT_ORIGIN must use HTTPS');
    if (!result.SMTP_HOST || !result.SMTP_FROM || !result.SMTP_USER || !result.SMTP_PASSWORD)
      throw new Error('Production requires SMTP_HOST, SMTP_FROM, SMTP_USER and SMTP_PASSWORD');
    if (/replace-with|change-?me|example|integration-tests/i.test(result.JWT_SECRET))
      throw new Error('Production JWT_SECRET must be a newly generated random secret');
  }
  return result;
}
export const env = parseEnvironment(process.env);
