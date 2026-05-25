import { z } from 'zod';

// === Requests ===

export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const RegisterRequestSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export const ProfileUpdateRequestSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  profile_img: z.string().url().optional(),
});

// === Responses ===

export const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  profile_img: z.string().nullable(),
  provider: z.string(),
});

export const AuthResponseSchema = z.object({
  message: z.string(),
  access_token: z.string(),
  user: UserSchema,
});

export const TokenResponseSchema = z.object({
  access_token: z.string(),
});

// === Inferred Types ===

export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;
export type ProfileUpdateRequest = z.infer<typeof ProfileUpdateRequestSchema>;
export type User = z.infer<typeof UserSchema>;
export type AuthResponse = z.infer<typeof AuthResponseSchema>;
export type TokenResponse = z.infer<typeof TokenResponseSchema>;
