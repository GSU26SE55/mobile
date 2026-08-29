import { z } from 'zod';
import {
  addressField,
  birthDateField,
  fullNameField,
  optionalPhoneField,
} from '@/src/shared/schemas/common.schema';

export const updateProfileSchema = z.object({
  fullName:    fullNameField,
  // The BE now enforces the Vietnamese mobile format and a 1900 birth-year floor
  // (AccountFieldPolicy) — a bare max(20) / free-form date would send payloads it rejects.
  phoneNumber: optionalPhoneField,
  address:     addressField,
  birthDate:   birthDateField,
  // No timeZone: it is a fixed deployment constant (Asia/Ho_Chi_Minh) with no editor on
  // any client, and the profile form never sends it. Declaring it here would invite a
  // caller to pass "" and blank the stored value.
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
