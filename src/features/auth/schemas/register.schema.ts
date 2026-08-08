import { z } from 'zod';

export const registerSchema = z
  .object({
    fullName:    z.string().min(1, 'Full name is required').max(150, 'Maximum 150 characters'),
    email:       z.string().min(1, 'Email is required').email('Invalid email format'),
    password:    z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(100, 'Maximum 100 characters')
      .regex(/[A-Z]/, 'Must contain at least 1 uppercase letter')
      .regex(/[a-z]/, 'Must contain at least 1 lowercase letter')
      .regex(/[0-9]/, 'Must contain at least 1 digit')
      // Matches BE PasswordPolicy: special character = any character that isn't a letter/digit/whitespace (not just !@#$%^&*).
      .regex(/[^A-Za-z0-9\s]/, 'Must contain at least 1 special character'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Password confirmation does not match',
    path: ['confirmPassword'],
  });

export type RegisterInput = z.infer<typeof registerSchema>;
