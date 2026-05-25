/**
 * Runtime environment validation.
 * Fails loudly at module load if required env vars are missing.
 * This file is imported by the API client, ensuring validation
 * happens before any network requests.
 */

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        `Set it in .env.local (development) or your deployment platform (production).`
    );
  }
  return value;
}

export const env = {
  NEXT_PUBLIC_API_URL: requireEnv('NEXT_PUBLIC_API_URL'),
} as const;
