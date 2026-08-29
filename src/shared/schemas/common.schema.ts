import { z } from 'zod';

/**
 * Shared field rules — one place to mirror the BE (AuthService AccountFieldPolicy /
 * PasswordPolicy, TicketService ChatBodyPolicy).
 *
 * These were previously copied into each feature schema, which is how mobile drifted
 * behind the BE: the phone/full-name/birth-year rules were tightened server-side and the
 * copies here were never updated.
 */

/** BE PasswordPolicy: min 8, max 100, upper/lower/digit + any non-alphanumeric, non-whitespace char. */
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 100;

export const passwordField = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
  .max(PASSWORD_MAX_LENGTH, `Maximum ${PASSWORD_MAX_LENGTH} characters`)
  .regex(/[A-Z]/, 'Must contain at least 1 uppercase letter')
  .regex(/[a-z]/, 'Must contain at least 1 lowercase letter')
  .regex(/[0-9]/, 'Must contain at least 1 digit')
  .regex(/[^A-Za-z0-9\s]/, 'Must contain at least 1 special character');

/** AccountFieldPolicy.EmailMaxLength. */
export const EMAIL_MAX_LENGTH = 256;

export const emailField = z
  .string()
  .min(1, 'Email is required')
  .max(EMAIL_MAX_LENGTH, `Maximum ${EMAIL_MAX_LENGTH} characters`)
  .email('Invalid email format');

/** AccountFieldPolicy: 2–150 characters. */
export const fullNameField = z
  .string()
  .min(2, 'Full name must be at least 2 characters')
  .max(150, 'Maximum 150 characters');

/** AccountFieldPolicy.PhoneRegex — Vietnamese mobile number: 0 + 3/5/7/8/9 + 8 digits. */
export const PHONE_REGEX = /^0[35789][0-9]{8}$/;

export const optionalPhoneField = z
  .string()
  .regex(PHONE_REGEX, 'Invalid phone number')
  .optional()
  .or(z.literal(''));

/** AccountFieldPolicy.MinBirthYear — the BE rejects anything earlier. */
export const MIN_BIRTH_YEAR = 1900;

/** Date of birth as "yyyy-MM-dd" — optional, not in the future, not before 1900. */
export const birthDateField = z
  .string()
  .optional()
  .refine((v) => !v || new Date(v) <= new Date(), 'Date of birth cannot be in the future')
  .refine(
    (v) => !v || new Date(v).getFullYear() >= MIN_BIRTH_YEAR,
    `Date of birth must be from ${MIN_BIRTH_YEAR} onwards`,
  );

/** AccountFieldPolicy.AddressMaxLength. */
export const addressField = z
  .string()
  .max(500, 'Maximum 500 characters')
  .optional()
  .or(z.literal(''));

/** 6-digit OTP — the shape every OTP flow on the BE expects. */
export const otpField = z
  .string()
  .length(6, 'OTP must be exactly 6 digits')
  .regex(/^\d{6}$/, 'OTP must contain only digits');

/** TicketService ChatOptions.MaxBodyLengthDefault. */
export const COMMENT_MAX_LENGTH = 10000;

/**
 * Whitespace/emoji-only bodies are rejected by ChatBodyPolicy on the BE (add AND edit).
 * The BE writes the emoji block as raw UTF-16 surrogate ranges, which JS reads as lone
 * surrogates — hence the `u` flag and the code-point range covering the same characters.
 */
const WHITESPACE_OR_EMOJI_ONLY =
  /^(?:[\s\u2190-\u21FF\u2600-\u27BF\u2B00-\u2BFF\u{1F000}-\u{1FAFF}]|\uFE0F|\u200D)*$/u;

/** True when a comment body would be rejected by the BE as whitespace/emoji-only. */
export const isWhitespaceOrEmojiOnly = (body: string): boolean =>
  WHITESPACE_OR_EMOJI_ONLY.test(body);

export const commentBodyField = z
  .string()
  .max(COMMENT_MAX_LENGTH, `Maximum ${COMMENT_MAX_LENGTH} characters`)
  .refine(
    (v) => v === '' || !isWhitespaceOrEmojiOnly(v),
    'Content must not contain only whitespace or emoji',
  );
