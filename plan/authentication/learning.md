# Authentication — What Was Built

So far: sign-up works end to end. Login is design only (not connected yet).
Full plan: [../authentication.md](../authentication.md)

## Steps (in order)

1. Added shadcn `input` and `label`
2. Built the shared auth layout (wine brand panel + form area)
3. Built the `/signup` and `/login` pages
4. Wrote one Zod schema used by both the form and the API
5. Installed `@node-rs/argon2` (password hashing) and `migrate-mongo` (indexes)
6. Wrote a migration that creates the indexes for `users` and `rateLimits`
7. Added new error codes `EMAIL_TAKEN` (409) and `RATE_LIMITED` (429)
8. Built password hashing, the rate limiter and the `User` model
9. Wrote `signUp()` — the business rule
10. Added `POST /api/auth/signup`
11. Connected the sign-up form to the API; on success it goes to `/login`
12. Tested with `curl` and checked Atlas (only a hash is stored, never the password)

### What happens when someone signs up

1. Browser checks the form with the Zod schema
2. `fetch('/api/auth/signup')` sends name, email, password
3. `handler()` checks Origin and validates again with the same schema
4. Rate limiter: max 3 sign-ups per hour per IP
5. `signUp()` rejects common passwords, hashes the password, saves the user
6. Duplicate email → `409 EMAIL_TAKEN`; success → `201`
7. Form saves the email in `sessionStorage` and opens `/login`, which shows "Account created"

---

## React

- **Client components** — `SignupForm`, `LoginForm`, `FormField` use `"use client"` (they handle typing and clicks).
- **Custom hook `useAuthForm`** — shared form logic for sign-up and login:
  - validates on submit, then re-validates while typing
  - keeps one error per field
  - moves focus to the first wrong field
- **`useState`** — field errors, "submitting…" state, form-level error, show/hide password.
- **`useEffect` + `useRef`** — moves focus to the error message so screen readers announce it.
- **`FormData`** — reads the form values without one state variable per input.
- **`fetch()`** — calls the API and switches on `error.code` (never on the message text).
- **`sessionStorage`** — passes the new email to the login page without putting it in the URL.
- **Accessibility** — `<label>` for each input, `aria-invalid`, `aria-describedby` links errors, `role="alert"`, `autocomplete` (`new-password`, `email`), `noValidate` so our messages replace the browser's.

## Next.js

- **Route group `(auth)`** — `/signup` and `/login` share `(auth)/layout.tsx` without `(auth)` in the URL.
- **`layout.tsx`** — wraps both pages in `AuthShell` (brand panel + form column).
- **Route handler** — `src/app/api/auth/signup/route.ts` exports `POST`. It is thin: rate limit → `signUp()` → `201`.
- **`useRouter()` from `next/navigation`** — sends the user to `/login` after sign-up.
- **next-intl** — error keys like `emailTaken` map to text in `messages/en.json` under `Auth.errors`.
- **Shared schema** — `auth.schemas.ts` has no `server-only`, so the browser form and the API import the same file.

## Node.js

- **Zod schema** (`auth.schemas.ts`) — trims name, lowercases email, password 8–128 characters, rejects unknown fields (`strictObject`).
- **`src/server/auth/password.ts`** — `hashPassword()` with Argon2id (19 MiB memory, 2 passes). The plain password is never stored.
- **`src/modules/auth/common-passwords.ts`** — blocks passwords like `password123` (server only).
- **`src/modules/auth/signup.ts` → `signUp()`** — the business rule: check common password → hash → create user → map duplicate email to `EMAIL_TAKEN`.
- **`AppError` with headers** — `RATE_LIMITED` sends `Retry-After` so the form can say "try again in N minutes".
- **`created()`** — helper that returns `201 { data }`.
- **`clientIp()`** — reads `x-real-ip` (set by Vercel) for the rate-limit key.

## MongoDB

- **`User` model** (`src/modules/auth/models/user.model.ts`) — `email`, `passwordHash`, `name`, timestamps (only what sign-up needs). Registered as `models.User ?? model(...)` to survive hot reload.
- **Unique index on `email`** — the database itself rejects a second account with the same email (error code `11000`), even if two sign-ups race.
- **`rateLimits` collection** (`src/server/rate-limit.ts`) — one counter per key (e.g. `signup:ip:1.2.3.4`):
  - `findOneAndUpdate` + `$inc` adds 1 inside the current window
  - `upsert` starts a new window when the old one ended
  - TTL index on `expiresAt` lets MongoDB delete old counters by itself
- **migrate-mongo** — `migrations/20261118000000-signup-indexes.js` creates the 3 indexes (`up`) and removes them (`down`). Run with `npm run migrate`. Its bookkeeping lives in the `migrations` collection.
- **Why migrations, not Mongoose** — `autoIndex: false`, so indexes are created once on purpose, never on app start.

---

## What each file does

### Frontend — pages (`src/app/(auth)/`)

- **`layout.tsx`** — wraps `/signup` and `/login` in the same two-column frame (`AuthShell`).
- **`signup/page.tsx`** — the `/signup` page: brand panel on the left, title + `SignupForm` on the right.
- **`login/page.tsx`** — the `/login` page: same layout with `LoginForm` (design only, not connected yet).

### Frontend — components (`src/components/auth/`)

- **`auth-shell/`** — the outer frame: two columns on desktop, stacked on mobile.
- **`auth-panel/`** — the wine brand panel: logo, headline and decorative preview cards (hidden from screen readers).
- **`auth-form-column/`** — the form side: page title, subtitle, the form, the "Already have an account? Log in" link and the footer.
- **`form-field/`** — one labelled input with hint, error message and a show/hide button for passwords.
- **`use-auth-form/use-auth-form.ts`** — the shared hook: validates with Zod, keeps one error per field, focuses the first wrong field.
- **`signup-form/`** — the sign-up form: sends `POST /api/auth/signup`, shows server errors (email taken, too many tries), then goes to `/login`.
- **`login-form/`** — the login form: shows "Account created" and fills in the email after sign-up. It doesn't call an API yet.
- **`src/components/ui/input.tsx`, `label.tsx`** — shadcn building blocks used by `form-field`.
- **`messages/en.json` → `Auth`** — all text on these pages, including the error messages.

### Shared by frontend and backend

- **`src/modules/auth/auth.schemas.ts`** — the Zod rules for sign-up and login (name, email, password). The browser uses them to check the form, and the API uses the same file to check the request.

### Backend — API route (`src/app/api/auth/`)

- **`signup/route.ts`** — `POST /api/auth/signup`. It stays thin: it checks the rate limit, calls `signUp()` and returns `201`. It has no business rules of its own.

### Backend — business logic (`src/modules/auth/`)

- **`signup.ts` → `signUp()`** — the sign-up rule: reject common passwords, hash the password, save the user, and turn a duplicate email into `EMAIL_TAKEN`.
- **`common-passwords.ts`** — the list of well-known passwords that `signUp()` refuses.
- **`models/user.model.ts`** — the `User` Mongoose model (the shape of a document in the `users` collection).

### Backend — server infrastructure (`src/server/`)

- **`auth/password.ts`** — `hashPassword()` with Argon2id. Login will add a `verifyPassword()` here later.
- **`http.ts`** — `handler()` wraps every API route: checks Origin, validates with Zod, turns errors into `{ error: { code, … } }`, adds `X-Request-Id`. Also holds `created()` and `clientIp()`.
- **`errors.ts`** — `AppError` and the list of error codes (`VALIDATION_ERROR`, `EMAIL_TAKEN`, `RATE_LIMITED`, …).
- **`rate-limit.ts`** — `rateLimit()`, which counts requests per key in the `rateLimits` collection and throws `RATE_LIMITED` when a key goes over its limit.
- **`db.ts`** — `connectDb()` connects to MongoDB Atlas once and reuses the connection; `isDuplicateKeyError()` spots error `11000` (used for `EMAIL_TAKEN`).
- **`env.ts`** — reads and checks environment variables (e.g. `MONGODB_URI`) with Zod.

### Database

- **`migrations/20261118000000-signup-indexes.js`** — creates the unique `email` index on `users` and the 2 indexes on `rateLimits`. Run with `npm run migrate`.

### How they connect

```
SignupForm (browser)
  → POST /api/auth/signup          src/app/api/auth/signup/route.ts
    → handler()                    src/server/http.ts       (Origin + Zod check)
    → rateLimit()                  src/server/rate-limit.ts (3 per hour per IP)
    → signUp()                     src/modules/auth/signup.ts
      → hashPassword()             src/server/auth/password.ts
      → UserModel.create()         src/modules/auth/models/user.model.ts → MongoDB `users`
  ← 201 { data } → router.push('/login')
```
