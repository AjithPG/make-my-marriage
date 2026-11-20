# Login — What Was Built

Status: built and tested 2026-11-20 — login, `/welcome` and logout.
Sign-up notes: [../authentication/learning.md](../authentication/learning.md)

## Session token and cookie (in brief)

- **The problem** — HTTP forgets you after every request. After login, the server needs a way to know "this request is from Meera" on every later request.
- **Session token** — a long random string (like `k9Xf2…`) the server creates when you log in. It works like a temporary key to your account, so it must be impossible to guess.
- **Session** — a row in the `sessions` collection: which user it belongs to and when it expires. The token is what points to that row.
- **Cookie** — a small value the browser stores and sends back automatically with every request to our site. We keep the token in a cookie called `mm_session`.
- **Why only a hash is stored** — the database keeps `hash(token + TOKEN_PEPPER)`, never the token itself. Someone who reads the database can't log in with what they find, and without the pepper they can't make a fake session either.
- **Cookie settings**:
  - `httpOnly` — JavaScript in the page can't read it, so a malicious script can't steal it
  - `Secure` (production) — only sent over HTTPS
  - `SameSite=Lax` — not sent with forms posted from other sites
  - `path=/` — sent on every page of our site
- **Logout** — delete the session row and clear the cookie. The old token stops working right away.

## Steps (in order)

1. ✅ `TOKEN_PEPPER` added to `src/server/env.ts` and `.env.example`
2. ✅ `src/server/auth/token.ts` — create a random token and hash it with the pepper
3. ✅ `src/server/auth/cookie.ts` — set, read and clear `mm_session`
4. ✅ `verifyPassword()` added to `src/server/auth/password.ts`
5. ✅ `Session` model + migration for its indexes
6. ✅ `lastLoginAt` added to the `User` model (login is the feature that uses it)
7. ✅ `login()` — the business rule
8. ✅ Rate limit: 5 failed logins per 15 minutes, per email and per IP
9. ✅ `POST /api/auth/login`
10. ✅ Connect the login form to the API (success → `/welcome`)
11. ✅ Migration run, `curl` checks, Atlas check, build
12. ✅ `getSession()` — reads the cookie and finds the logged-in user
13. ✅ `/welcome` page — name, email and a Log out button; no session → `/login`
14. ✅ `POST /api/auth/logout` — deletes the session, clears the cookie, always `204`
15. ✅ `curl` checks for `/welcome` and logout, build

### What happens when someone logs in

1. Browser checks the form with `loginSchema`
2. `fetch('/api/auth/login')` sends email and password
3. `handler()` checks Origin and validates again with the same schema
4. Rate limiter: already 5 failed attempts for this email or this IP in 15 minutes → `429` (only failures are counted)
5. `login()` finds the user and checks the password with Argon2id (unknown email → checked against a dummy hash)
6. Wrong email or wrong password → count 1 failure for the email and the IP, then the same `401 INVALID_CREDENTIALS` (never says which one)
7. Correct → the browser's old session (if any) is deleted, a new random token is made, its hash saved in `sessions`, `lastLoginAt` set, token sent back in the `mm_session` cookie
8. The form opens `/welcome`; from now on the browser sends the cookie with every request

### What happens on /welcome

1. The page frame (logo, card outline) is static HTML, sent at once
2. Inside `<Suspense>`, `getSession()` reads `mm_session`, hashes it and looks up an unexpired session, then the user
3. Found → the card shows "Welcome, {name}", the name and the email
4. Not found (no cookie, expired, logged out) → `redirect('/login')`

### What happens on logout

1. Log out button → `fetch('/api/auth/logout', { method: 'POST' })`
2. `handler()` checks Origin (so another site can't log you out)
3. The session row is deleted and the cookie is cleared (`Max-Age=0`) → `204`
4. The button sends you to `/login`; the old token no longer works anywhere

---

## React

- **`LoginForm`** — now calls `fetch('/api/auth/login')` like `SignupForm`, with a "Logging in…" state and a focused form-level error.
- **Error by code** — `INVALID_CREDENTIALS` → "Email or password is incorrect", `RATE_LIMITED` → "Try again in N minutes" (from `Retry-After`).
- **No token in React** — the cookie is `httpOnly`, so the form never sees or stores the token. The browser handles it.
- **`LogoutButton`** — a small client component (`"use client"`) inside the server-rendered `WelcomeCard`; it calls the API and then `router.replace('/login')` (replace, so Back doesn't return to `/welcome`).
- **Server components** — `WelcomeShell` and `WelcomeCard` run only on the server and send plain HTML; no JavaScript for them reaches the browser.

## Next.js

- **Route handler** — `src/app/api/auth/login/route.ts` exports `POST`. Thin: rate limit → `login()` → set cookie.
- **Setting a cookie in a route handler** — `(await cookies()).set(...)` from `next/headers`; Next.js adds the `Set-Cookie` header to the response we return.
- **Reading the cookie on the server** — `(await cookies()).get("mm_session")`, only in `src/server/auth/cookie.ts`, never in `modules/` (modules never import `next/*`).
- **`<Suspense>` + `cacheComponents`** — reading cookies makes that part per-request, so it must sit inside `<Suspense>`. The build shows `/welcome` as ◐ Partial Prerender: static frame + streamed user details. The fallback is `WelcomeCardSkeleton` ("Loading your account…").
- **`redirect()` from `next/navigation`** — sends logged-out visitors to `/login` from inside a server component.
- **Server page reads, API writes** — `/welcome` calls `getSession()` directly (a read); logout goes through `/api` (a write), never a server action.
- **`robots: { index: false }`** — search engines don't list `/welcome`.
- **Hidden pages keep their state** (bug found 2026-11-20) — with `cacheComponents`, Next.js keeps recently visited pages alive but hidden (React `<Activity>`) and shows them again as they were. After logout, `/login` came back still saying "Logging in…" with the password filled in. Fix: effects are cleaned up when a page is hidden, so both forms reset themselves there, but only after a successful submit.
- **`connection()` before the current time** — `getSession()` compares `expiresAt` with `new Date()`. Next.js flags reading the time while prerendering, so `/welcome` calls `await connection()` first: everything after it runs only for a real request.

## Node.js

- **`crypto.randomBytes(32)`** — makes the token (256 random bits, impossible to guess).
- **HMAC-SHA256** (`crypto.createHmac`) — hashes the token with `TOKEN_PEPPER`.
- **`verify()` from `@node-rs/argon2`** — checks a typed password against the stored hash.
- **Dummy check** — for an unknown email, we still run one Argon2id check against `DUMMY_HASH` (a fixed hash with the same settings), so the response takes the same time and doesn't reveal which emails have accounts.
- **Failure-only rate limit** — `assertUnderLimit()` checks without counting; `recordAttempt()` counts a failure. Successful logins never use up the limit. Locally the IP key is `login:ip:::1`.

## MongoDB

- **`sessions` collection** — `userId`, `tokenHash`, `expiresAt`, timestamps. Only what login needs: `lastSeenAt` / `absoluteExpiresAt` come with sliding expiry, `userAgent` / `ip` with an "active sessions" screen.
- **Indexes** (`migrations/20261120000000-login-indexes.js`, with `down`):
  - `tokenHash` unique — finds a session from a cookie in one lookup
  - `expiresAt` TTL — MongoDB deletes expired sessions by itself
  - `userId` is not added yet: only "sign out everywhere" (password reset) needs it
- **`users.lastLoginAt`** — set on every successful login.
- **Session lookup** — `findOne({ tokenHash, expiresAt: { $gt: now } })` uses the unique `tokenHash` index; `expiresAt` is compared too because the TTL monitor deletes old rows only about once a minute.
- **Logout** — `deleteOne({ tokenHash })`: once the row is gone, the cookie is useless even if someone copied it.

---

## What each file does

- **`src/server/env.ts`** — reads `TOKEN_PEPPER` and refuses to start without it.
- **`src/server/auth/token.ts`** — `createToken()` and `hashToken()`. No database, no business rules.
- **`src/server/auth/cookie.ts`** — `readSessionToken()`, `setSessionCookie()` and `clearSessionCookie()` with the settings above.
- **`src/server/auth/password.ts`** — gains `verifyPassword()`.
- **`src/modules/auth/models/session.model.ts`** — the `Session` Mongoose model.
- **`src/modules/auth/models/user.model.ts`** — gains `lastLoginAt`.
- **`src/modules/auth/session.ts`** — `createSession()` (token + hash + 30-day expiry), `deleteSession()` and `getSession()` (cookie → session → user, or `null`).
- **`src/modules/auth/login.ts` → `login()`** — rate limit, check password, replace the old session, create a new one, update `lastLoginAt`.
- **`src/server/rate-limit.ts`** — gains `assertUnderLimit()` and `recordAttempt()`.
- **`src/server/errors.ts`** — gains `INVALID_CREDENTIALS` (401).
- **`src/app/api/auth/login/route.ts`** — `POST /api/auth/login`.
- **`src/app/api/auth/logout/route.ts`** — `POST /api/auth/logout`: delete the session, clear the cookie, `204`.
- **`src/server/http.ts`** — gains `noContent()` (empty `204` response).
- **`src/app/welcome/page.tsx`** — the `/welcome` page: static shell + `<Suspense>` around the part that calls `getSession()`.
- **`src/components/auth/welcome-shell/`** — centred frame with the logo.
- **`src/components/auth/welcome-card/`** — "Welcome, {name}", name and email, Log out button; plus the loading skeleton.
- **`src/components/auth/logout-button/`** — calls the logout API, then opens `/login`.
- **`messages/en.json` → `Auth.welcome`** — the text on `/welcome`.
- **`src/components/auth/login-form/`** — calls the API and shows errors.
- **`migrations/20261120000000-login-indexes.js`** — the 2 `sessions` indexes.

### How they connect

```
LoginForm (browser)
  → POST /api/auth/login           src/app/api/auth/login/route.ts
    → handler()                    src/server/http.ts       (Origin + Zod check)
    → readSessionToken()           src/server/auth/cookie.ts (old session, if any)
    → assertUnderLimit()           src/server/rate-limit.ts (5 failed / 15 min)
    → login()                      src/modules/auth/login.ts
      → verifyPassword()           src/server/auth/password.ts
      → createSession()            src/modules/auth/session.ts
        → createToken(), hashToken() src/server/auth/token.ts
        → SessionModel.create()    src/modules/auth/models/session.model.ts → MongoDB `sessions`
    → set mm_session cookie        src/server/auth/cookie.ts
  ← 200 { data } + Set-Cookie → router.push('/welcome')

/welcome (server)                 src/app/welcome/page.tsx
  → getSession()                  src/modules/auth/session.ts
    → readSessionToken()          src/server/auth/cookie.ts
    → SessionModel.findOne()      → MongoDB `sessions`, then `users`
  → WelcomeCard, or redirect('/login')

LogoutButton (browser)
  → POST /api/auth/logout         src/app/api/auth/logout/route.ts
    → deleteSession()             src/modules/auth/session.ts
    → clearSessionCookie()        src/server/auth/cookie.ts
  ← 204 → router.replace('/login')
```
