# Frontend Runtime Checklist

## SSR Safety Rules

- [ ] Never access `localStorage`, `window`, or `document` outside `useEffect` or guarded by `typeof window !== 'undefined'`
- [ ] Never use browser APIs in `useState` initializers without a `typeof window` guard
- [ ] All components using hooks must have `'use client'` directive
- [ ] Server components must not import from modules that use browser APIs at module level

## Client/Server Boundaries

- [ ] Root `layout.tsx` is a Server Component — it can import client components but must not use hooks
- [ ] Client components must have `'use client'` at the top of the file
- [ ] Server components can pass props to client components but not vice versa
- [ ] `useSearchParams()` requires a `<Suspense>` boundary wrapper (Next.js 15)

## Hydration Safety

- [ ] No conditional rendering based on `typeof window` that differs between server and client
- [ ] `useState` initializers must return the same value on server and client (use `useEffect` for client-only state)
- [ ] No `Date.now()` or random values in initial render — use `useEffect` for dynamic values
- [ ] Auth state must start as `loading: true` and resolve in `useEffect`

## Provider Rules

- [ ] `AuthProvider` wraps all routes via root layout
- [ ] `ThemeProvider` uses `typeof window` guard in `useState` initializer
- [ ] Providers must not redirect during SSR — only in `useEffect`
- [ ] Context values must have stable references (use `useCallback`/`useMemo` where needed)

## Auth Rules

- [ ] `getToken()` returns `null` during SSR (checks `typeof window`)
- [ ] No `router.push()` outside `useEffect`
- [ ] `ProtectedRoute` waits for `loading` to be `false` before redirecting
- [ ] Landing page (`/`) never redirects — it's always public
- [ ] Login page redirects authenticated users to `/dashboard` only after hydration

## Error Boundaries

- [ ] `global-error.tsx` exists at `src/app/` level
- [ ] `error.tsx` exists in each route group (`(app)/`, `(auth)/`)
- [ ] Error boundaries are client components with `'use client'`
- [ ] Error boundaries provide retry buttons

## Environment Variables

- [ ] Client-side env vars use `NEXT_PUBLIC_` prefix
- [ ] Server-only env vars are never imported in client components
- [ ] `process.env.NEXT_PUBLIC_*` is safe in both server and client components
- [ ] Never throw at module level if an env var is missing — use fallback values

## Runtime Validation Workflow

1. `npm run build` — must pass with zero errors
2. `npm run dev` — verify `/`, `/login`, `/dashboard` return 200
3. `npm run start` — verify production mode serves all routes
4. Check browser console for hydration warnings
5. Test unauthenticated flow: `/` → landing page (no redirect)
6. Test protected route: `/dashboard` → redirects to `/login` if unauthenticated
7. Test auth flow: login → redirect to `/dashboard`
8. Test logout: returns to `/`

## Common Runtime Failures

| Symptom | Cause | Fix |
|---------|-------|-----|
| 500 on all pages | Route conflict (duplicate pages) | Remove duplicate `page.tsx` files |
| Blank page | Client component missing `'use client'` | Add directive |
| Hydration mismatch | `localStorage` in initial render | Move to `useEffect` |
| Redirect loop | Auth guard fires before hydration | Check `loading` state first |
| `useSearchParams` error | Missing Suspense boundary | Wrap with `<Suspense>` |
| Module not found | Missing dependency or workspace ref | Install or copy types locally |
