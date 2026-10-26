import { z } from 'zod';
export const lureTypes = [
  'Crankbait',
  'Jerkbait',
  'Minnow',
  'Soft Plastic',
  'Spinner',
  'Spinnerbait',
  'Spoon',
  'Jig',
  'Topwater',
  'Swimbait',
  'Other',
] as const;
export const fishSpecies = [
  'Northern Pike',
  'European Perch',
  'Zander',
  'Trout',
  'Bass',
  'Catfish',
  'Asp',
  'Chub',
];
const text = (max = 200) => z.string().trim().max(max);
const optionalText = (max = 200) => text(max).optional();
const positive = z.number().finite().positive();
const date = z.string().refine((v) => !Number.isNaN(Date.parse(v)), 'Enter a valid date');
export const registerSchema = z
  .object({
    name: text(80).min(2),
    email: z
      .email()
      .max(254)
      .transform((v) => v.toLowerCase()),
    password: z
      .string()
      .min(12, 'Use at least 12 characters')
      .max(128)
      .refine(
        (v) => new TextEncoder().encode(v).length <= 72,
        'Use at most 72 bytes for your password',
      ),
  })
  .strict();
export const loginSchema = registerSchema
  .pick({ email: true, password: true })
  .extend({ password: z.string().min(1).max(128) });
export const profileSchema = registerSchema.pick({ name: true, email: true });
export const passwordSchema = z
  .object({
    currentPassword: z.string().min(1).max(128),
    newPassword: registerSchema.shape.password,
  })
  .strict();
export const lureSchema = z
  .object({
    name: text(120).min(1, 'Model is required'),
    brand: text(80).min(1, 'Brand is required'),
    type: z.enum(lureTypes),
    lengthMm: positive.max(2000),
    weightGrams: positive.max(10000).nullable().optional(),
    color: optionalText(80),
    buoyancy: z.enum(['floating', 'sinking', 'suspending']).nullable().optional(),
    technique: optionalText(120),
    description: optionalText(4000),
    purchaseDate: date.nullable().optional(),
    purchasePrice: z.number().finite().nonnegative().max(1000000).nullable().optional(),
  })
  .strict();
export const catchSchema = z
  .object({
    lureId: z.string().regex(/^[a-f\d]{24}$/i, 'Select a lure'),
    species: text(100).min(1, 'Species is required'),
    caughtAt: date,
    lengthCm: positive.max(2000).nullable().optional(),
    weightKg: positive.max(2000).nullable().optional(),
    location: optionalText(200),
    notes: optionalText(4000),
    waterConditions: optionalText(500),
    weather: optionalText(500),
  })
  .strict();
export type LureInput = z.infer<typeof lureSchema>;
export type CatchInput = z.infer<typeof catchSchema>;
export interface ImageReference {
  _id: string;
  provider: 'local' | 'cloudinary';
  fileId: string;
  url: string;
}
export interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: ImageReference;
  createdAt: string;
}
export interface Lure extends LureInput {
  _id: string;
  image?: ImageReference;
  createdAt: string;
  catchCount: number;
  summary?: { species: number; largestLength: number | null; largestWeight: number | null };
}
export interface FishCatch extends Omit<CatchInput, 'lureId'> {
  _id: string;
  lureId: string | Lure;
  photo?: ImageReference;
  createdAt: string;
}
export interface Page<T> {
  data: T[];
  total: number;
  page: number;
  pages: number;
}
export interface Stats {
  totalLures: number;
  totalCatches: number;
  uniqueSpecies: number;
  topLures: Lure[];
  recentCatches: FishCatch[];
  activity: { month: string; count: number }[];
  species: { name: string; count: number }[];
}
