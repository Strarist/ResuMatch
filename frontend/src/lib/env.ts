/**
 * Runtime environment configuration.
 * SSR-safe: provides fallback for development, warns instead of crashing.
 */

const getEnv = (value: string | undefined, name: string, fallback: string): string => {
  if (!value) {
    if (typeof window !== 'undefined') {
      console.warn(`[env] ${name} not set, using fallback: ${fallback}`);
    }
    return fallback;
  }
  return value;
};

export const env = {
  NEXT_PUBLIC_API_URL: getEnv(process.env.NEXT_PUBLIC_API_URL, 'NEXT_PUBLIC_API_URL', 'http://localhost:8000'),
  NEXT_PUBLIC_DEV_MODE: process.env.NEXT_PUBLIC_DEV_MODE === 'true',
} as const;
