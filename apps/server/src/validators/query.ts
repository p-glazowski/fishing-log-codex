import { z } from 'zod';
export const querySchema = z.object({
  page: z.coerce.number().int().min(1).max(100000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(12),
  search: z.string().max(120).optional(),
  sort: z.string().max(30).optional(),
  brand: z.string().max(80).optional(),
  type: z.string().max(80).optional(),
  minSize: z.coerce.number().nonnegative().optional(),
  maxSize: z.coerce.number().nonnegative().optional(),
  lure: z.string().optional(),
  species: z.string().max(100).optional(),
  from: z.iso.date().optional(),
  to: z.iso.date().optional(),
  fromInstant: z.iso.datetime().optional(),
  toExclusive: z.iso.datetime().optional(),
});
export const timeZoneSchema = z
  .string()
  .max(100)
  .refine((value) => {
    try {
      new Intl.DateTimeFormat('en', { timeZone: value });
      return true;
    } catch {
      return false;
    }
  }, 'Invalid time zone')
  .default('UTC');
export const escape = (v: string) => v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
