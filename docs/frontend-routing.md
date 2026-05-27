# ResuMatch Frontend Routing Architecture

## Route Groups

```
src/app/
├── page.tsx              → /              (Landing page - public)
├── layout.tsx            → Root layout    (AuthProvider, ThemeProvider)
├── globals.css
│
├── (auth)/               → Auth pages (public, no protected layout)
│   ├── login/page.tsx    → /login
│   ├── signup/page.tsx   → /signup
│   └── auth/callback/    → /auth/callback (OAuth redirect handler)
│
└── (app)/                → Protected workspace (requires authentication)
    ├── layout.tsx        → ProtectedRoute + WorkspaceProvider + AppShell
    ├── loading.tsx       → Shared loading state
    ├── dashboard/        → /dashboard
    ├── upload/           → /upload
    ├── analysis/         → /analysis
    ├── resumes/          → /resumes
    ├── profile/          → /profile
    ├── settings/         → /settings
    ├── matches/          → /matches
    ├── intelligence/     → /intelligence
    ├── roadmap/          → /roadmap
    ├── roadmap-v2/       → /roadmap-v2
    └── recruiter-intelligence/ → /recruiter-intelligence
```

## Layout Inheritance

| Route Group | Root Layout | Group Layout | Auth Protection |
|---|---|---|---|
| `/` (landing) | ✅ AuthProvider, ThemeProvider | None | Public |
| `(auth)/*` | ✅ AuthProvider, ThemeProvider | None | Public |
| `(app)/*` | ✅ AuthProvider, ThemeProvider | ProtectedRoute + AppShell | Protected |

## Public vs Protected Routes

### Public Routes (no auth required)
- `/` — Landing/marketing page
- `/login` — Login page (redirects to `/dashboard` if authenticated)
- `/signup` — Registration page
- `/auth/callback` — OAuth callback handler

### Protected Routes (auth required, redirects to `/login` if unauthenticated)
- `/dashboard` — Main workspace dashboard
- `/upload` — Resume upload
- `/analysis` — Job match analysis
- `/resumes` — Resume management
- `/profile` — User profile
- `/settings` — Account settings
- `/matches` — Job matches
- `/intelligence` — Career intelligence
- `/roadmap` — Career roadmap
- `/roadmap-v2` — Enhanced roadmap
- `/recruiter-intelligence` — Recruiter insights

## Auth Flow

```
Unauthenticated → /login → Google OAuth or email/password → /auth/callback → /dashboard
Authenticated → /dashboard (or any protected route)
Logout → / (landing page)
```

## Route Group Conventions

1. **Route groups use parentheses** — `(app)`, `(auth)` — they don't affect the URL path
2. **Protected routes go in `(app)/`** — the group layout wraps all children with `ProtectedRoute`
3. **Public routes go in `(auth)/`** — no auth layout, inherits only root
4. **Landing page stays at root** — `src/app/page.tsx`
5. **Never create a page at both `(app)/X/page.tsx` AND `/X/page.tsx`** — this causes route conflicts

## Preventing Route Conflicts

### Rules
- Each URL path must resolve to exactly ONE page file
- Route groups `(name)` are invisible in the URL — `(app)/dashboard` resolves to `/dashboard`
- If `(app)/dashboard/page.tsx` exists, there must NOT be a `dashboard/page.tsx` at the same level

### Validation Checklist
1. No page file exists at both `src/app/X/page.tsx` and `src/app/(group)/X/page.tsx`
2. No two route groups contain the same route path
3. All protected pages are inside `(app)/`
4. All auth pages are inside `(auth)/`
5. Only `page.tsx` and `layout.tsx` exist at the root `src/app/` level (plus globals.css, favicon)

## Adding New Routes

### New protected page:
```
src/app/(app)/new-feature/page.tsx
```
- Automatically gets auth protection from `(app)/layout.tsx`
- Automatically gets AppShell navigation
- No need for inline auth guards

### New public page:
```
src/app/(auth)/new-page/page.tsx   (if auth-related)
src/app/new-page/page.tsx          (if marketing/standalone)
```

## Next.js 15 Requirements

- Pages using `useSearchParams()` must be wrapped in a `<Suspense>` boundary
- Use the pattern: inner `Content` component + outer default export with Suspense wrapper
