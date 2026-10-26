import { z } from 'zod';
const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  CLIENT_ORIGIN: z.url().default('http://localhost:5173'),
  MONGODB_URI: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  STORAGE_PROVIDER: z.enum(['local', 'cloudinary']).default('local'),
  UPLOAD_DIR: z.string().default('./uploads'),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
});
export const env = schema.parse(process.env);
if (
  env.STORAGE_PROVIDER === 'cloudinary' &&
  (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET)
)
  throw new Error('Cloudinary configuration is incomplete');
if (env.NODE_ENV === 'production' && !env.CLIENT_ORIGIN.startsWith('https://'))
  throw new Error('Production CLIENT_ORIGIN must use HTTPS');
