/**
 * Dev-mode utilities — gates Phase 9 / experimental pages behind a flag.
 */

const DEV_ONLY_ROUTES = [
  '/analysis',
  '/predictive',
  '/executive',
  '/explainability',
  '/observability',
  '/convergence',
  '/resilience',
  '/diagnostics',
  '/roadmap',
] as const;

export function isDevOnlyRoute(pathname: string): boolean {
  return DEV_ONLY_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

export function isDevModeEnabled(): boolean {
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_DEV_MODE === 'true';
  }
  if (process.env.NEXT_PUBLIC_DEV_MODE === 'true') return true;
  const params = new URLSearchParams(window.location.search);
  if (params.get('dev') === 'true') {
    localStorage.setItem('dev_mode', 'true');
    return true;
  }
  return localStorage.getItem('dev_mode') === 'true';
}

export const devOnlyNavItems = [
  { href: '/analysis', label: 'Analysis (Legacy)' },
  { href: '/predictive', label: 'Predictive' },
  { href: '/executive', label: 'Executive' },
  { href: '/explainability', label: 'Explainability' },
  { href: '/observability', label: 'Observability' },
  { href: '/convergence', label: 'Convergence' },
  { href: '/resilience', label: 'Resilience' },
  { href: '/diagnostics', label: 'Diagnostics' },
  { href: '/roadmap', label: 'Roadmap (Legacy SSE)' },
] as const;
