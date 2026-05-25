/**
 * Runtime environment configuration.
 * SSR-safe: provides fallback for development, warns instead of crashing.
 */

const getEnv = (name: string, fallback: string): string => {
  const value = process.env[name];
  if (!value) {
    if (typeof window !== 'undefined') {
      console.warn(`[env] ${name} not set, using fallback: ${fallback}`);
    }
    return fallback;
  }
  return value;
};

export const env = {
  NEXT_PUBLIC_API_URL: getEnv('NEXT_PUBLIC_API_URL', 'http://localhost:8000'),
} as const;
