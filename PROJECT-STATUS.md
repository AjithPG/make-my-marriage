# Project Status

_Last updated: 20 Nov 2026 · Branch: `dev`_

## Features

| #   | Feature        | Plan                                             | Status                                                           |
| --- | -------------- | ------------------------------------------------ | ---------------------------------------------------------------- |
| 1   | Landing page   | —                                                | ✅ Done (leftovers in Auth Step 0)                               |
| 2   | Authentication | [plan/authentication.md](plan/authentication.md) | 🔄 Sign-up, login, `/welcome`, logout built — next: forgot/reset |

---

## 2. Authentication

_Goal: sign up, log in, log out, forgot/reset password, welcome screen. Plan: [plan/authentication.md](plan/authentication.md)_

### Step 0 — Finish the homepage

- ⬜ `(marketing)/layout.tsx` with header, footer and a "Skip to content" link
- ⬜ Move `not-found.tsx` to a CSS module
- ⬜ `npm run build` passes

### Step 1 — Setup (you)

- ✅ `.env.local` created from `.env.example` (git-ignored)
- ✅ `.env.local`: `APP_URL=http://localhost:3000`
- ✅ `.env.local`: `TOKEN_PEPPER` generated (`.env.example` gets it back in Step 4)
- ✅ `.env.local`: real `MONGODB_URI` and `MIGRATE_MONGODB_URI` (same user for now)
- ✅ App connects to Atlas (`makemymarriage` database)
- ✅ 2026-11-18: trimmed to landing page + DB connection + `/api/health`; models, migrate-mongo, auth helpers, R2, Resend, Vercel config and cron removed until a feature needs them
- ⬜ Resend key (optional; dev prints reset links in the terminal)

> ⚠️ **Before production:** split the database users — app user `readWrite` on `makemymarriage` only, separate migrate user (`readWrite` + `dbAdmin`). The current user has `atlasAdmin` (full project control).

### Step 2 — Sign-up and login pages from Stitch (design only)

- ✅ Add shadcn `input` and `label`
- ✅ Shared auth layout (wine brand panel + form area; wine header on mobile)
- ✅ `/signup` page
- ✅ `/login` page
- ✅ Client-side validation with the shared Zod schema (`src/modules/auth/auth.schemas.ts`, error keys → `Auth.errors`)
- ✅ Accessibility: labels, linked errors, focus on first error, show-password label, autocomplete
- ⬜ Compared with Stitch desktop and mobile screens (you, in the browser)

### Sign-up flow (plan: "Sign-up flow (build order)")

- ✅ S1 Packages (`@node-rs/argon2`, `migrate-mongo`); `MIGRATE_MONGODB_URI` in `.env.example`
- ✅ S2 migrate-mongo config + scripts; `signup-indexes` migration (users, rateLimits); `npm run migrate`
- ✅ S3 `EMAIL_TAKEN`, `RATE_LIMITED`, `AppError.headers`; `created()`, `clientIp()`, `isDuplicateKeyError()`
- ✅ S4 `server/auth/password.ts` (Argon2id)
- ✅ S5 `server/rate-limit.ts` (model + limiter)
- ✅ S6 `user` model
- ✅ S7 Strict `signupSchema` + server error keys; common-password list; `signUp()`
- ✅ S8 `POST /api/auth/signup` route
- ✅ S9 Sign-up form calls the API; success → `/login` with "Account created"
- ✅ S10 Typecheck, build, `curl` checks (201, 409, 400 ×3, 403, 429), Atlas check (Argon2id hash, no plain password)
- ⬜ Browser run: sign up → `/login` shows "Account created" with the email filled in (you)

### Login flow (notes: [plan/login/learning.md](plan/login/learning.md))

- ✅ L1 `TOKEN_PEPPER` in `src/server/env.ts` (`authEnv`) and `.env.example`
- ✅ L2 `server/auth/token.ts` (`createToken()`, peppered `hashToken()`)
- ✅ L3 `server/auth/cookie.ts` (`readSessionToken()`, `setSessionCookie()`)
- ✅ L4 `verifyPassword()` in `server/auth/password.ts`
- ✅ L5 `session` model; `login-indexes` migration (`tokenHash` unique, `expiresAt` TTL), run on Atlas
- ✅ L6 `lastLoginAt` on the `user` model
- ✅ L7 `INVALID_CREDENTIALS`; `assertUnderLimit()` + `recordAttempt()`; `modules/auth/session.ts`; `login()` (dummy hash, old session replaced)
- ✅ L8 `POST /api/auth/login`; `loginSchema` strict
- ✅ L9 Login form calls the API; success → `/welcome`
- ✅ L10 Typecheck, build, `curl` checks (200 + cookie, 401 ×2 same error, 400, 403, 429 after 5 failures), Atlas check (hash only, old session replaced); test data removed
- ⬜ Browser run: log in with your account (you)
- ✅ L11 `getSession()`; `/welcome` (name, email, Log out; no session → `/login`); `POST /api/auth/logout` (204, cookie cleared); `noContent()`
- ✅ L12 `curl` checks: `/welcome` with cookie shows the user, without → `/login`, logout 204 + cookie cleared, other origin 403, old cookie rejected after logout; build (◐ `/welcome`); test data removed
- ⬜ Browser run: log in → `/welcome` → Log out → `/login` (you)

### Step 3 — Rate limiter

- ✅ Install migrate-mongo (config, scripts, `MIGRATE_MONGODB_URI`), done in sign-up S1–S2
- ✅ `src/server/rate-limit.ts` (model + limiter), sign-up S5
- ✅ Migration for its 2 indexes (with `down`), `signup-indexes`
- ✅ Limits: sign-up 3 / hour, login 5 failed / 15 min
- ⬜ Forgot password 3 / hour (with Step 8)

### Step 4 — Auth helpers + token pepper

- ⬜ Create `src/server/auth/` (`token.ts`, `password.ts` + `@node-rs/argon2`, `cookie.ts`)
- ⬜ `TOKEN_PEPPER` in `src/server/env.ts` and `.env.example`
- ⬜ `hashToken()` → HMAC-SHA256 with the pepper
- ⬜ Session timing constants (30 days sliding, 90 days max)
- ✅ Decision recorded in `CLAUDE.md`

### Step 5 — Auth rules (`src/modules/auth/`)

- ⬜ Models: `user`, `session`, `password-reset`
- ⬜ Migration for their indexes (with `down`)
- ⬜ `auth.schemas.ts` (name, normalised email, password)
- ⬜ Common-password check (server only)
- ⬜ Sign-up rules (`EMAIL_TAKEN`, incl. race on unique index)
- ⬜ Login rules (same error for unknown email, dummy check, fresh session)
- ⬜ Session create / load / slide / delete
- ⬜ `getSession()` for server pages

### Step 6 — `handler()` gets sessions

- ⬜ `auth: "user"` option + `ctx.user`
- ⬜ 401 `UNAUTHENTICATED` without a session

### Step 7 — Endpoints

- ⬜ `POST /api/auth/signup`
- ⬜ `POST /api/auth/login`
- ⬜ `POST /api/auth/logout`
- ⬜ `GET /api/me`

### Step 8 — Forgot and reset password

- ⬜ `POST /api/auth/password/forgot`
- ⬜ `POST /api/auth/password/reset`
- ⬜ `src/server/email.ts` + `resend` package
- ⬜ Reset email template
- ⬜ `/forgot-password` and `/reset-password` pages

### Step 9 — Connect it up

- ⬜ Sign-up and login forms call the API
- ⬜ `/welcome` page (name, email, Log out)
- ⬜ Homepage "Log in" → `/login`, "Create your wedding" → `/signup`
- ⬜ `returnTo` redirect after login / sign-up

### Step 10 — Check

- ⬜ Typecheck and build pass
- ⬜ Flows by hand: sign up, log out, log in, wrong password, 6th failed login blocked
- ⬜ POST from another origin rejected
- ⬜ Forgot → reset; old session stops working
- ⬜ Keyboard-only run; mobile width

---

## 1. Landing page ✅

_Goal: the homepage (`/`) from the Stitch designs (desktop + mobile), with copy that follows the PRD._

### Design analysis

- ✅ Downloaded the Stitch "Landing Page" (desktop) and "Mobile Landing Page" screens
- ✅ Listed the 10 sections: header, hero, trust strip, how it works, features, guest experience, family roles, FAQ, final CTA, footer
- ✅ Found the copy that goes beyond the first version (RSVP, sadya count, guest QR uploads, custom domain, concierge)

### Decisions

- ✅ The homepage lives in `src/app/(marketing)/page.tsx` (it already serves `/`)
- ✅ No Tailwind classes in JSX: each component gets its own `.module.css` using `@apply`
- ✅ shadcn components (`src/components/ui/`) keep their own styling
- ✅ Out-of-scope cards get first-version content (invited count, guest groups, couple-uploaded photos)
- ✅ Buttons and links point to `#` for now
- ✅ Accessible text sizes: body 16px, smallest 14px

### Setup

- ✅ Added the styling and accessibility rules to `CLAUDE.md`
- ✅ Added the shadcn Accordion (for the FAQ)
- ✅ Brand colours set in `globals.css` (wine `#7A1F33`, tint, ink, slate, mist, line)
- ✅ Fonts switched to Inter (body) and Fraunces (headings)
- ✅ All page text written in `messages/en.json` and matched to the PRD
- ✅ Fixed `next.config.ts` so `.module.css` files stay scoped (they were treated as global CSS)

### Sections (`src/components/home/`)

- ✅ Header: brand logo, desktop nav, Log in, Create button, mobile menu
- ✅ Footer: small logo, copyright, Privacy / Terms / Contact / Report a page
- ✅ Section heading: label + h2 + intro, centred or left-aligned
- ✅ Hero: headline, 2 buttons, 3 checkmarks, phone preview, invited + WhatsApp cards
- ✅ Trust strip: 4 badges
- ✅ How it works: 3 numbered cards
- ✅ Features grid: 6 cards (website, WhatsApp, guest list, to-dos, gallery, YouTube)
- ✅ Guest experience: guest-view mockup + 3 points
- ✅ Bring the family in: Admin / Manager cards
- ✅ FAQ: 5 questions in the shadcn Accordion
- ✅ Final call to action: wine panel + button
- ✅ `(marketing)/page.tsx` shows all sections plus header and footer

### Leftovers (moved to Authentication Step 0 and Step 10)

- ➡️ Marketing layout with skip link, `not-found` CSS module, build check
- ⬜ Compare with the Stitch desktop and mobile screens
- ⬜ Accessibility check: keyboard, focus, contrast, zoom to 200%

---

## 📝 Notes

- Every component has its own folder: `src/components/<area>/<name>/<name>.tsx` + `<name>.module.css`.
- To reuse a class inside the same CSS module, use `composes: className;` (`@apply` only works with Tailwind utilities).
- CSS modules start with `@reference "../../../app/globals.css";`. Using `@import` there breaks the build.
- If a CSS change doesn't show up, restart `npm run dev` (Turbopack sometimes keeps old CSS modules).
- Workflow: discuss → `plan/<feature>.md` → approval → code, ticking steps here as they finish.
