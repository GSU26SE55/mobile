// GH-56 — Zod schemas. Parsed manually with safeParse() (mobile doesn't use React Hook Form).
import { z } from 'zod';

// deviceCode (code printed on the device). BE does Trim().ToUpperInvariant() then matches the unique index (L3)
// → client also trims + uppercases for consistent display/submission. Regex drops the `i` flag since the value is already uppercase.
export const deviceCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .min(3, 'deviceCode must be at least 3 characters')
  .max(64, 'deviceCode must be at most 64 characters')
  .regex(/^[A-Z0-9-]+$/, 'Only uppercase letters, digits, and hyphens allowed');

// createCalibrationSchema — field-level rules. Cross-field rule (expiresAt > calibratedAt) is in superRefine.
export const createCalibrationSchema = z
  .object({
    channel: z.string().trim().toLowerCase().min(1, 'Required').max(32, 'Max 32 characters'),
    unit: z.string().trim().min(1, 'Required').max(16, 'Max 16 characters'),
    scale: z.number().refine((v) => v !== 0, 'scale must be nonzero'), // doc: "must be nonzero"
    offset: z.number(),
    calibratedAt: z.string().min(1, 'Required'), // ISO UTC — N2: does NOT block future dates (per contract)
    expiresAt: z.string().optional(),
    batteryAssetId: z.string().uuid('Invalid batteryAssetId').optional().nullable(),
    notes: z.string().max(500, 'Max 500 characters').optional(),
  })
  // N1: cross-field — field-level Zod can't compare two fields, must be placed at the object level.
  .refine((v) => !v.expiresAt || new Date(v.expiresAt) > new Date(v.calibratedAt), {
    message: 'expiresAt must be after calibratedAt',
    path: ['expiresAt'],
  });

export type CreateCalibrationInput = z.infer<typeof createCalibrationSchema>;
