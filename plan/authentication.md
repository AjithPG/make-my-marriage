# Feature Plan — Authentication

_Status: proposed · Milestone: M1 (first part) · Specs: PRD §5.1, API Design §3.1, §5, §6_

## Goal

A couple can sign up, log in, log out and reset a forgotten password. After login they see a
simple welcome screen with their details and a Log out button.

## Requirements

- Sign-up and login pages from the Stitch design
- Sign-up collects name, email, password
- Login takes email and password, with clear validation and invalid-credentials errors
- Users stored in MongoDB with a unique, normalised email and a securely hashed password
- Server-side sessions in a cookie; session tokens hashed with a configured pepper
- Endpoints: sign-up, login, logout, me, forgot password, reset password
- Homepage buttons go to the real pages
- Minimal welcome screen after login with user details and Log out
- Input validation, login and sign-up rate limits, secure cookies, request Origin protection

## Boundaries

| Where                     | Holds                                                                                                                                                          |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/app/api/**/route.ts` | Thin handlers: validate, call the module, return                                                                                                               |
| `src/modules/auth/`       | Use cases: sign-up, login, logout, forgot/reset rules; session records in MongoDB (create, load, slide, delete); Zod schemas                                   |
| `src/server/auth/`        | How auth is carried: token generation, peppered token hashing, cookie, Argon2id password hashing, session timing constants. No Mongoose, no models (CLAUDE.md) |

---

## Stitch screens: what we keep and drop

| Stitch shows                                                      | Plan            | Why                                                                                            |
| ----------------------------------------------------------------- | --------------- | ---------------------------------------------------------------------------------------------- |
| Two columns: wine brand panel + form (mobile: wine header on top) | ✅ Keep         | Matches the homepage look                                                                      |
| Email, password, show/hide password, "Forgot password?"           | ✅ Keep         | PRD §5.1                                                                                       |
| Full name, email, password, "At least 8 characters" on sign-up    | ✅ Keep         | API sign-up takes name, email, password                                                        |
| "Continue with Google" / "Sign up with Google"                    | ❌ Drop         | PRD: no Google sign-in in V1                                                                   |
| "Keep me signed in on this device"                                | ❌ Drop         | Sessions are always 30 days sliding, 90 days max                                               |
| "Need help? Contact concierge"                                    | ❌ Drop         | No support channel in the PRD                                                                  |
| "Confirmed 142 / Pending RSVP 68" card                            | 🔄 Change       | "142 / 210 invited" (no RSVP in V1)                                                            |
| "I agree to the Terms and Privacy Policy" checkbox                | ❌ Drop for now | Those pages come in M5                                                                         |
| —                                                                 | ➕ Add          | Note under email: "Check this is right — password reset links go here" (no email verification) |

---

## Steps

### Step 0 — Finish the homepage

- `(marketing)/layout.tsx` with header, footer and a "Skip to content" link
- Move `not-found.tsx` to a CSS module
- `npm run build` passes

### Step 1 — Setup (you)

- `.env.local`:
  - real `MONGODB_URI`
  - `APP_URL=http://localhost:3000` (must match, or the Origin check rejects every form)
  - `TOKEN_PEPPER` (at least 32 random characters; I'll give you a command to generate it)
  - Resend key optional: without it, in development the reset link is printed in the terminal
- `npm run migrate` against Atlas (after Step 3 installs migrate-mongo and adds the first migration)

### Step 2 — Sign-up and login pages from Stitch (design only)

- Add shadcn `input` and `label`
- Shared auth layout (`src/app/(auth)/layout.tsx`): wine brand panel + form area; mobile shows the wine header on top
- `/signup`: name, email, password (show/hide), "At least 8 characters", email note, Create account button, "Already have an account? Log in"
- `/login`: email, password (show/hide), "Forgot password?" link, Log in button, "New here? Create your wedding"
- Each component in its own folder with a CSS module; text in `messages/en.json`
- Client-side validation with the shared Zod schema (messages below); forms are not connected to the API yet
- Accessibility:
  - Labels on every field, errors linked to their fields
  - Focus moves to the first error
  - Show-password button has a label
  - `autocomplete` attributes for password managers
- Check against the Stitch desktop and mobile screens

---

## Sign-up flow (build order)

_Approved 2026-11-18; updated the same day: a successful sign-up redirects to `/login`, so sign-up
creates **no session**. Sessions, `TOKEN_PEPPER`, the token/cookie helpers and the `sessions`
model and indexes arrive with login (Steps 4–7 below)._

### What happens

1. The form validates in the browser (Step 2), then posts `{ name, email, password }` to
   `POST /api/auth/signup`
2. `handler()` checks `Origin` and validates the body with `signupSchema` (strict: unknown fields → 400)
3. Rate limit: 3 sign-ups per hour per IP → 429 `RATE_LIMITED` + `Retry-After`
4. Common password → 400 `VALIDATION_FAILED` (`password: passwordCommon`)
5. Hash the password (Argon2id) and insert the user; duplicate email → 409 `EMAIL_TAKEN`
6. Respond `201 { "data": { "id", "name", "email" } }`
7. The browser goes to `/login`, which says "Account created" and has the email filled in

### S1 — Packages and environment

#### Packages (exact versions)

- `@node-rs/argon2` (dependency): Argon2id hashing, prebuilt binaries that run on Vercel
- `migrate-mongo` (dev dependency): creates the indexes

#### Environment

- `.env.example`: add `MIGRATE_MONGODB_URI` (used only by migrate-mongo, never on Vercel)
- `TOKEN_PEPPER` waits for login (only session and reset tokens use it)

### S2 — Migration tooling and indexes

#### Tooling

- `migrate-mongo-config.js`: reads `MIGRATE_MONGODB_URI` from `.env.local`; database name from the URI path
- npm scripts: `migrate`, `migrate:down`, `migrate:status`, `migrate:create`

#### Migration `migrations/20261118000000-signup-indexes.js`

- `users`: `{ email: 1 }` unique
- `rateLimits`: `{ key: 1 }` unique, `{ expiresAt: 1 }` TTL 0 s
- `down` drops all of them

#### Run

- `npm run migrate` against the Atlas dev database; `npm run migrate:status` shows it applied

### S3 — Error codes and HTTP helpers (`src/server/`)

#### `errors.ts`

- Add `EMAIL_TAKEN` (409) and `RATE_LIMITED` (429)
- Bring back the `headers` option on `AppError` (for `Retry-After`)

#### `http.ts`

- Bring back `created()` (201 + `{ data }`) and `clientIp(req)`
- Error responses send `AppError.headers`

#### `db.ts`

- `isDuplicateKeyError(error)`: MongoDB error code 11000 (used by the rate limiter and sign-up)

### S4 — Password hashing (`src/server/auth/password.ts`)

- `hashPassword(password)`: Argon2id (library default), OWASP settings: 19 MiB memory, 2 passes, 1 thread
- `verifyPassword()` comes with login

### S5 — Rate limiter (`src/server/rate-limit.ts`)

#### Model

- `rateLimits`: `key` (e.g. `signup:ip:1.2.3.4`), `count`, `expiresAt` (end of window)

#### `rateLimit({ key, limit, windowMs })`

- Atomic `$inc` on an unexpired counter
- No unexpired counter → reset the expired one or insert a new one (upsert); a racing insert hits
  the unique index and retries the `$inc`
- Over the limit → throws `RATE_LIMITED` with `Retry-After` in seconds
- Always compares `expiresAt` (MongoDB's TTL monitor runs only about once a minute)

### S6 — User model (`src/modules/auth/models/user.model.ts`)

- Database Design §3.1, sign-up fields only: `email` (lowercased, trimmed), `passwordHash`, `name`
- `lastLoginAt`, `passwordChangedAt` and `notificationPrefs` are added by the login,
  password-change and notifications features
- `{ email: 1 }` unique declared in the schema to match the migration
- Collection `users`, `timestamps: true`

### S7 — Sign-up rules (`src/modules/auth/`)

#### `auth.schemas.ts`

- Make `signupSchema` strict
- Error keys gain `passwordCommon` and `emailTaken` (set by the server, shown by the form)

#### `common-passwords.ts`

- Set of about 100 well-known passwords of 8+ characters, compared lowercased
- Can grow later (e.g. from SecLists, MIT) without code changes

#### `signup.ts`

- `signUp(input)`:
  1. Reject common passwords
  2. `hashPassword()`
  3. Insert the user; duplicate-key error → `EMAIL_TAKEN`
  4. Return `{ id, name, email }`
- No email pre-check: the unique index handles duplicates, including two racing sign-ups

### S8 — Route (`src/app/api/auth/signup/route.ts`)

- `handler({ body: signupSchema }, …)`
- `rateLimit({ key: "signup:ip:<ip>", limit: 3, windowMs: 1 hour })`
- `created(await signUp(body))`
- Thin: no rules in the route

### S9 — Connect the sign-up form

#### Submit

- After client validation, `fetch("/api/auth/signup")` with JSON; button shows "Creating account…"
  and is disabled while the request runs
- Errors by `code`, never by message:
  - `VALIDATION_FAILED` → each `details[].message` (an error key) under its field
  - `EMAIL_TAKEN` → under the email field
  - `RATE_LIMITED` → message above the button with minutes from `Retry-After`
  - Anything else or no network → "Something went wrong. Please try again."
- Focus moves to the first field with an error, or to the message

#### Redirect to login

- On 201: keep the email in `sessionStorage` (never in the URL), then go to `/login`
- `/login` reads and removes it: "Account created. Log in to continue." (`role="status"`),
  email filled in, focus on the password field

### S10 — Check

- `npm run typecheck` and `npm run build` pass
- `curl` (each run uses its own `X-Forwarded-For`, so local manual testing isn't rate-limited):
  - Happy path → 201
  - Same email again → 409 `EMAIL_TAKEN`
  - Empty or invalid fields → 400 with error keys in `details`
  - Unknown field → 400
  - Common password → 400 `passwordCommon`
  - Wrong `Origin` → 403 `CSRF_ORIGIN_MISMATCH`
  - 4th sign-up in an hour → 429 with `Retry-After`
- Atlas: the user has an Argon2id `passwordHash`, never the plain password
- In the browser (you): sign up → lands on `/login` with the message and email

### Not in the sign-up flow

- Sessions, cookies, `TOKEN_PEPPER` (login, Steps 4–7)
- Login, logout, `/api/me`, `getSession()`, `handler()` `auth: "user"`
- Forgot and reset password (Step 8)

---

### Step 3 — Rate limiter

- Install migrate-mongo (exact version): `migrate-mongo-config.js`, `migrate*` npm scripts, `MIGRATE_MONGODB_URI` in `.env.example`
- `src/server/rate-limit.ts`: `rateLimits` model + limiter in one file (CLAUDE.md)
- Migration for its 2 indexes (`key` unique, `expiresAt` TTL), with `down`
- Limits (API §5):
  - Login: 5 **failed** attempts / 15 min, per email and per IP
  - Sign-up: 3 / hour per IP
  - Forgot password: 3 / hour per IP and per email

### Step 4 — Auth helpers + token pepper (`src/server/auth/`, `src/server/env.ts`)

- Create `src/server/auth/`: `token.ts` (random token + `hashToken()`), `password.ts` (Argon2id, installs `@node-rs/argon2`), `cookie.ts` (`mm_session` read/set/clear)
- New env group with `TOKEN_PEPPER` (+ add it to `.env.example`)
- `hashToken()` is HMAC-SHA256 with the pepper (used for session and reset tokens)
- Session timing constants: 30 days sliding, 90 days max
- `CLAUDE.md` already records the decision (replaces "No `SESSION_SECRET`")
- Note: changing the pepper signs everyone out and voids open reset links

#### What is the pepper? (simple explanation)

A pepper is a **secret value kept outside the database** (in the `TOKEN_PEPPER` env var) that is
mixed in every time a token is hashed.

**How sessions work:**

1. You log in; the server creates a long random token.
2. Your browser keeps the token in the `mm_session` cookie.
3. The database stores only a **hash** of it (a scrambled version that can't be turned back).
4. On each request the server hashes your cookie again and looks that hash up.

**With the pepper**, step 3 stores `hash(token + secret pepper)` instead of `hash(token)`. Think of
it as a stamp only the server has; it lives in Vercel's settings, never in the database.

**Why it helps** — imagine someone gets into the database (leaked backup, stolen DB password):

| They try to…                                                                       | Without pepper                             | With pepper                                             |
| ---------------------------------------------------------------------------------- | ------------------------------------------ | ------------------------------------------------------- |
| Use a stored hash as a cookie                                                      | ❌ Doesn't work (needs the original token) | ❌ Doesn't work                                         |
| Make their own session: invent a token, hash it, insert a session row for any user | ⚠️ **Works** — the hash formula is public  | ✅ Blocked — can't make a valid hash without the pepper |

**Trade-offs:**

- Keep it secret like the database password; never commit it to git
- Don't change it casually: a new pepper means every stored hash stops matching, so everyone is
  signed out and open reset links stop working
- Not used for passwords: they already use Argon2id. The pepper only covers session cookies and
  reset links

### Step 5 — Auth rules (`src/modules/auth/`)

- Models in `src/modules/auth/models/`: `user`, `session`, `password-reset` (built now; no models exist yet)
- Migration for their indexes (users `email` unique; sessions `tokenHash` unique, `userId`, `expiresAt` TTL; passwordResets `tokenHash` unique, `expiresAt` TTL), with `down`
- `auth.schemas.ts` (Zod only, shared by forms and API): name 1–80, email trimmed + lowercased, password 8–128
- Common-password list, checked on the server only
- Sign-up: duplicate email → `EMAIL_TAKEN` (also when two sign-ups race on the unique index)
- Login:
  - Unknown email and wrong password give the same `INVALID_CREDENTIALS` error
  - A dummy password check runs for unknown emails, so timing doesn't reveal accounts
  - Old session in the browser is deleted; a fresh one is issued
- Sessions:
  - Create: random token in the cookie, only its peppered hash in the database
  - Load: reject expired sessions and sessions older than the last password change
  - Slide: extend at most once a day, never past 90 days
  - Delete
- `getSession()` for server pages

### Step 6 — `handler()` gets sessions

- New option `auth: "user"`: loads the session, 401 `UNAUTHENTICATED` without one
- `ctx.user` available in route handlers
- Existing Origin check stays on every non-GET request

### Step 7 — Endpoints

| Route                   | Does                                                               |
| ----------------------- | ------------------------------------------------------------------ |
| `POST /api/auth/signup` | Create account + session, set cookie (`EMAIL_TAKEN` if used)       |
| `POST /api/auth/login`  | Create session, set cookie (`INVALID_CREDENTIALS`, `RATE_LIMITED`) |
| `POST /api/auth/logout` | Delete session, clear cookie; always 204                           |
| `GET /api/me`           | Current user (weddings list empty until weddings exist)            |

Cookie: `mm_session`, httpOnly, Secure in production, SameSite=Lax, path `/`.

### Step 8 — Forgot and reset password

- `POST /api/auth/password/forgot`: always 204, even for unknown emails; emails a link valid for 30 minutes
- `POST /api/auth/password/reset`: new password, link marked used, all sessions deleted (signed out everywhere)
- Add `src/server/email.ts` (`sendEmail()`, installs `resend`, `RESEND_API_KEY` / `EMAIL_FROM` env group); without a key in development, print the link to the terminal
- Plain email template (text + HTML)
- Pages `/forgot-password` and `/reset-password?token=…` in the same auth layout (no Stitch screens; follow the login design)

### Step 9 — Connect it up

- Sign-up and login forms call the API with `fetch` (no server actions); errors shown by error code
- `/welcome`: user's name and email + Log out button; session part inside `<Suspense>` (needed with `cacheComponents`); no session → `/login`
- Homepage "Log in" → `/login`, "Create your wedding" → `/signup`
- After login or sign-up: go to `returnTo` (only a path on our own site), otherwise `/welcome`

### Step 10 — Check

- Typecheck and build pass
- Run every flow by hand:
  - Sign up, log out, log in
  - Wrong password; unknown email shows the same message
  - The 6th failed login is blocked
  - POST from another origin is rejected
  - Forgot then reset; the old session stops working
- Keyboard-only run through every page; check at mobile width

---

## Validation and error messages

| Case                          | Message                                                      |
| ----------------------------- | ------------------------------------------------------------ |
| Name empty / too long         | "Enter your name"                                            |
| Email invalid                 | "Enter a valid email address"                                |
| Password too short / too long | "Use at least 8 characters" / "Use 128 characters or fewer"  |
| Common password (server)      | "This password is too common. Choose another."               |
| Email already registered      | "An account with this email already exists. Log in instead?" |
| Wrong email or password       | "Email or password is incorrect"                             |
| Too many attempts             | "Too many attempts. Try again in N minutes."                 |
| Reset link expired or used    | "This link has expired. Request a new one."                  |

---

## Known limits (accepted)

- `EMAIL_TAKEN` reveals that an email has an account (API design accepts it; sign-up limit slows misuse)
- The homepage header still shows "Log in" after login (static cached page; fixed with the dashboard)
- A logged-in user who opens `/login` still sees the form (keeps the page static)
- Local testing hits the sign-up limit quickly; clear the `rateLimits` collection to reset

## Not in this feature

- Change password, edit name, delete account (with or after the dashboard)
- Email verification (v1.1)
- Google sign-in (not in V1)
