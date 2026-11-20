# AGENTS.md — Make My Marriage

Context for AI coding agents and developers working in this repo. Read this before changing code.
`CLAUDE.md` holds the same rules for Claude Code; if the two ever disagree, ask the maintainer.

## 1. The product in one paragraph

Make My Marriage is a free web app for Kerala weddings. A couple signs up, creates a wedding, adds
events (engagement, mehendi, haldi, wedding/muhurtham, reception) with venues and maps links, picks
an invitation design, and publishes a mobile-friendly guest site at `/<bride>-<groom>-<YYYY-MM-DD>`.
They invite guests one by one over WhatsApp (`wa.me` deep link, prefilled message) and track who has
been invited. They also get a to-do list (preloaded Kerala checklist), a photo gallery, YouTube live
stream embeds and in-app reminders.

- **Roles per wedding:** Admin (bride or groom; the creator, or co-admins), Manager (relatives).
  Guests never log in. One user can belong to several weddings, with a different role in each.
- **Admin only:** publish/unpublish, photos, slug, team management. **Creator only:** delete the wedding.
- **Privacy:** guests have no phone, email or address fields. Public pages show only published content.
- **Out of MVP:** RSVP, budgets, vendors, automatic messaging, Malayalam (v1.1), Google sign-in, email verification.

## 2. Source of truth

| Topic                                                    | Read                                                     |
| -------------------------------------------------------- | -------------------------------------------------------- |
| Features, roles, acceptance criteria                     | [docs/01-PRD.md](docs/01-PRD.md)                         |
| Architecture, request flows, security, deployment        | [docs/02-System-Design.md](docs/02-System-Design.md)     |
| 13 collections, fields, indexes, transactions, lifecycle | [docs/03-Database-Design.md](docs/03-Database-Design.md) |
| REST conventions, error codes, 61 endpoints, limits      | [docs/04-API-Design.md](docs/04-API-Design.md)           |
| Rules and decisions that override the docs               | [CLAUDE.md](CLAUDE.md) and section 9 below               |

Where the PRD disagrees with the other three docs on technical detail, the other three win.

## 3. Current state (scaffold only — no product features yet)

Built and working:

- Next.js app shell: root layout, landing page, 404 page, next-intl (English), shadcn `button` and `accordion`.
- Server infrastructure: env validation (`APP_URL`, `MONGODB_URI`), cached MongoDB connection,
  `handler()` wrapper, error codes.
- `GET /api/health` (pings MongoDB).

Not set up yet (add each only with the feature that needs it, including its package and env vars):
Mongoose models, migrate-mongo, auth helpers (cookie, token, Argon2id), `src/proxy.ts`, R2, Resend,
`vercel.json`, cron routes.

Not built yet: every product feature — auth endpoints, sessions in the DB, rate limiting, weddings,
team, events, guests, invitations, photos, to-dos, notifications, guest site, dashboard pages.

### Build order (PRD §10)

1. **M1** Accounts and wedding core: sign-up/login/logout/reset, session lifecycle, rate limiter,
   `/api/me`, create wedding, events, team invites and roles, permission checks.
2. **M2** Guest site: `/[slug]` page, slug rules, draft/publish + `revalidateTag`, invitation designs, PNG via `next/og`.
3. **M3** Guests and invites: guest list, bulk add, CSV import, WhatsApp invite flow, invited tracking.
4. **M4** Media and planning: photo uploads + Sharp, YouTube embeds, to-dos, notifications, cleanup cron jobs.
5. **M5** Hardening: accessibility, performance budget, security review, privacy policy.

## 4. Stack (versions are pinned exactly)

| Layer         | Choice                                                                                                           |
| ------------- | ---------------------------------------------------------------------------------------------------------------- |
| Runtime       | Node.js 22, npm (`save-exact=true`)                                                                              |
| Framework     | Next.js 16.4.6 App Router, React 19.3, Turbopack, `cacheComponents: true`                                        |
| Language      | TypeScript 5.9.3, `strict` + `noUncheckedIndexedAccess` (not TS 7)                                               |
| UI            | Tailwind CSS 4.3 (via `@tailwindcss/turbopack`, no PostCSS file), shadcn/ui on Radix, lucide icons, `cn` package |
| i18n          | next-intl 4, English only, no locale routing, strings in `messages/en.json`                                      |
| Validation    | Zod 4                                                                                                            |
| Database      | MongoDB Atlas (ap-south-1) + Mongoose 9; migrate-mongo planned for indexes                                       |
| Auth          | Planned: custom email/password, `@node-rs/argon2`, server-side sessions, `mm_session` cookie                     |
| Media / email | Planned: Cloudflare R2 via `@aws-sdk/client-s3` + presigner; Resend                                              |
| Hosting       | Planned: Vercel (`bom1`), Vercel Cron                                                                            |
| Formatting    | Prettier + Tailwind plugin. No ESLint, tests, git hooks or CI yet (deferred)                                     |

## 5. Code map

```text
src/
├─ i18n/request.ts              next-intl config (locale "en", time zone Asia/Kolkata)
├─ app/                         ROUTING ONLY
│  ├─ layout.tsx · globals.css · not-found.tsx
│  ├─ (marketing)/page.tsx      landing page
│  └─ api/health
├─ modules/<domain>/            BUSINESS LOGIC (+ that domain's models/)
│  (empty — created per feature)
├─ server/                      SERVER-ONLY INFRASTRUCTURE
│  ├─ env.ts      lazily validated env groups: appEnv, dbEnv
│  ├─ db.ts       connectDb() (cached, pool 5, autoIndex off)
│  ├─ errors.ts   AppError, ErrorCode → HTTP status (only codes in use)
│  └─ http.ts     handler(), ok()
└─ components/                  home/ sections · ui/ shadcn (button, accordion)
messages/en.json                all UI strings
```

## 6. Architecture rules (do not break)

- **Modular monolith, REST only.** Backend = route handlers in `src/app/api/**/route.ts`.
  No Express/NestJS. **No server actions for mutations**: every write goes through `/api`.
  Server components may call module code directly for **reads**.
- **Layers:** route handler → `handler()` → module code → Mongoose. Route handlers stay thin.
- **`src/app/`** is routing only. **`src/modules/`** holds business logic and never imports `next/*`.
  **`src/server/`** holds infrastructure only: no business rules, no feature models.
- **Models live in their domain module** (`src/modules/<domain>/models/*.model.ts`). No global models folder.
- **`modules/auth` vs `server/auth`:** `modules/auth` = what auth means (data + rules).
  `server/auth` = how it is carried (cookie, token, hashing); it never imports Mongoose.
  Dependency direction is `modules/auth → server/auth`.
- **`import "server-only"`** is the first line of every file in `src/server` and `src/modules`.
  Only exception: `src/modules/<m>/<m>.schemas.ts` (imports only `zod`, so client forms can share it).
- **No premature layers.** Don't create services, repositories, interfaces, placeholder pages or
  future API routes until a feature needs them.
- **`src/lib/`** (doesn't exist yet) is only for client-safe, framework-agnostic helpers used by 2+ features.
- **Tenancy:** every wedding-scoped query filters on `weddingId`. Roles come from `memberships`,
  loaded on every request; never store them in the session or cookie.
- **Authorization is server-side only**, checked in the route and re-checked in the module for
  sensitive actions (publish, photos, team, delete).

## 7. How to add a feature

1. Read the matching PRD section, the endpoint table in API Design §3 and the collection in Database Design §3.
2. **Schemas:** `src/modules/<m>/<m>.schemas.ts` with Zod (`z.strictObject` so unknown fields are rejected).
   Use the field rules in API Design §5.
3. **Logic:** add `<m>.service.ts` (rules, permission checks) and `<m>.repo.ts` (Mongoose queries,
   always taking `weddingId`) when the feature needs them. Throw `AppError` with a code from `errors.ts`.
4. **Route:** `src/app/api/.../route.ts` exporting `GET`/`POST`/`PATCH`/`PUT`/`DELETE`, each wrapped:

   ```ts
   import { z } from "zod";
   import { handler, created } from "@/server/http";

   const body = z.strictObject({ name: z.string().trim().min(1).max(100) });

   export const POST = handler({ body }, async ({ body, requestId }) => {
     // call module code here
     return created({ ... });
   });
   ```

5. **Indexes:** if the feature adds or changes an index, change the model **and** add a migration
   (`npm run migrate:create -- <name>`, with a `down`). Install migrate-mongo with the first one.
6. **Multi-document writes** listed in Database Design §5 run in a transaction (add `withTransaction()` to `server/db.ts` when the first one appears).
7. **UI strings** go in `messages/en.json`, never hard-coded.
8. **Verify** (section 10) before calling it done.

## 8. API and data conventions

- JSON in and out. Success `{ "data": … }`, lists add `"nextCursor"`, empty success = `204`.
- Errors: `{ "error": { code, message, details?, requestId } }`. Clients switch on `code`.
- Cursor pagination (`?limit=50&cursor=`), never `skip`. Limit 1–100, default 50.
- IDs are 24-hex ObjectIds; timestamps ISO 8601 UTC; calendar dates `YYYY-MM-DD` and times `HH:mm`
  in `Asia/Kolkata`.
- `handler()` already: rejects non-GET requests without a matching `Origin` (403 `CSRF_ORIGIN_MISMATCH`),
  rejects JSON over 100 KB (413), validates body/query/params, sets `X-Request-Id` and `Cache-Control: no-store`.
  Session loading and rate limits get added to it in M1.
- Caps: 15 events, 2,000 guests, 500 photos, 300 to-dos per wedding → 422 `LIMIT_REACHED`.
- Collections lower camelCase plural, fields camelCase, enums lowercase strings, `timestamps: true`,
  no soft deletes. Tokens are stored only as SHA-256 hashes; passwords as Argon2id.

## 9. Decisions that override the docs

- `src/proxy.ts` replaces the docs' root `middleware.ts` (Next 16 rename). It only checks the cookie exists.
- With `cacheComponents` on, `export const runtime` / `dynamic` are **rejected by the build**.
  Everything runs on Node.js anyway, and `handler()` calls `connection()` so API routes are never prerendered.
  Cache guest pages with `'use cache'` + `cacheTag('wedding:<id>')`. `maxDuration` is allowed.
- `notifications` reminder index is partial on `threshold: { $exists: true }`; read notifications
  expire 90 days after `readAt` (TTL partial on `read: true`).
- `weddings.slug` has a plain unique index (no collation).
- Rate limiter = one file `src/server/rate-limit.ts` (schema + limiter) plus its 2 indexes, built in M1.
- No `SESSION_SECRET` env var. CSP has no nonces. R2 client uses path-style URLs and only sends
  checksums when required (presigned PUTs from browsers break otherwise).
- HEIC uploads are accepted, but Sharp's prebuilt binaries can't decode HEIC: M4 must add a conversion path.
- A password change re-issues the current session. Cron cleanup also deletes used/expired team
  invites older than 30 days.
- Still open (decide in M4): `photos/complete` synchronous vs `202` + polling; HEIC conversion approach.

## 10. Commands and verification

| Command                           | Does                                     |
| --------------------------------- | ---------------------------------------- |
| `npm run dev`                     | Dev server on :3000 (needs `.env.local`) |
| `npm run build`                   | Production build; type errors fail it    |
| `npm run typecheck`               | `next typegen && tsc --noEmit`           |
| `npm run format` / `format:check` | Prettier                                 |

Before saying a change is done: `npm run typecheck`, `npm run build` and `npm run format:check` pass,
and any new endpoint has been called once with `curl` (happy path plus one error case).

## 11. Environment

Copy `.env.example` to `.env.local`. Variables are validated in groups, only when code that needs
them runs. Today: `APP_URL`, `MONGODB_URI`. Features add theirs (`TOKEN_PEPPER`, `MIGRATE_MONGODB_URI`,
`R2_*`, `RESEND_API_KEY`, `EMAIL_FROM`, `CRON_SECRET`) to `env.ts` and `.env.example`. Never use the `NEXT_PUBLIC_` prefix for secrets;
read env only through `src/server/env.ts`.

## 12. Gotchas

- Scripts that import `src/` must run with `tsx --conditions=react-server`, or `server-only` throws.
- Register models as `(models.X as Model<X> | undefined) ?? model("X", schema)` to survive hot reload.
- Never run migrations in the Vercel build; run them against the target DB before merging to `main`.
- When `src/proxy.ts` is added: it can't import `server-only` code, so it repeats the `mm_session`
  name; keep it in sync with `src/server/auth/cookie.ts`.
- MongoDB's TTL monitor runs about once a minute: always check `expiresAt` in queries, don't rely on TTL.
- Vercel Cron runs only on production deployments, in UTC; cron jobs must be idempotent.
- The session cookie is `Secure` only in production (Safari rejects Secure cookies on http://localhost).
- On Windows the repo path contains a space (`Namaste AI`): quote paths in scripts.

## 13. Git

- Branches: `main` (production), `dev` (integration, on GitHub). Work on feature branches off `dev`.
- Conventional commits: `feat(scope): …`, `fix(scope): …`, `chore: …`.
- Don't commit `.env.local` or any secret.
