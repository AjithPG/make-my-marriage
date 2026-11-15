# Make My Marriage — working rules

Free wedding website + planning app for Kerala weddings. Design docs live in `docs/`:
`02-System-Design.md`, `03-Database-Design.md`, `04-API-Design.md` are the technical source of truth;
`01-PRD.md` is for features and roles. Where the PRD disagrees on technical details, the other three win.
Decisions below override the docs where they differ.

## Architecture (fixed — ask before changing)

- Modular monolith, one Next.js App Router app, TypeScript strict everywhere.
- Backend = Next.js Route Handlers in `src/app/api/**/route.ts`, Node.js runtime. Explicit REST API. No Express, no NestJS,
  **no server actions for mutations** — every write goes through `/api`.
- Server components may call module code directly for **reads**.
- MongoDB Atlas + Mongoose. Zod for all validation (env, body, query, params).
- Custom email/password auth, Argon2id, server-side sessions in MongoDB, opaque token in the
  `mm_session` httpOnly cookie. No email verification in V1.
- Cloudflare R2 (S3 API, presigned uploads) for media; Resend for email.
- Vercel, region `bom1`; Vercel Cron for scheduled jobs.
- UI: Tailwind CSS v4 + shadcn/ui. Strings via next-intl (`messages/en.json`, English only, no locale routing).
- **One folder per component:** `src/components/<area>/<name>/<name>.tsx` + `<name>.module.css`
  (no `index.ts` barrels). Import as `@/components/home/site-header/site-header`.
- **No Tailwind utility classes in JSX.** Every component has its own `<name>.module.css` next to it
  with meaningful class names (`styles.heroTitle`), styled with `@apply` (start the file with
  `@reference "<relative path>/app/globals.css";`). Only shadcn files in `src/components/ui/` keep
  their own Tailwind classes; pass a module class via `className` to adjust them.
- Accessibility: body text ≥ 16px (`text-base`), smallest text 14px (`text-sm`), sizes in rem;
  visible focus, `motion-safe:` for animation, decorative mockups `aria-hidden`.
- Package manager: npm, exact versions (`.npmrc` → `save-exact=true`). Node 22.
- Deferred until asked: logger, automated tests, git hooks, CI, ESLint, Sharp.
- `cacheComponents` is on (Next 16 default). Route segment configs `runtime` and `dynamic` are
  rejected with it: everything already runs on Node.js, and `handler()` calls `connection()`
  so API routes are never prerendered. Cache guest pages with `'use cache'` + `cacheTag()`.

## Folder rules

| Folder                  | Holds                                                                              | Never holds                          |
| ----------------------- | ---------------------------------------------------------------------------------- | ------------------------------------ |
| `src/app/`              | Routing only: pages, layouts, route handlers (thin)                                | Business rules, DB access            |
| `src/modules/<domain>/` | Business logic and that domain's Mongoose models (`models/`)                       | Imports from `next/*`                |
| `src/server/`           | Server-only infrastructure (env, db, http, errors, R2, email, cron, auth plumbing) | Business rules, feature models       |
| `src/components/`       | UI components (`ui/` = shadcn)                                                     | Data access                          |
| `src/lib/`              | Client-safe, framework-agnostic helpers used by **2+ features**                    | Feature helpers, server code, "misc" |

- Mongoose models live in their domain module (`src/modules/<domain>/models/*.model.ts`). There is no global models folder.
- Every file in `src/server` and `src/modules` starts with `import 'server-only'`.
  **One exception:** `src/modules/<m>/<m>.schemas.ts` — no `server-only`, imports only `zod`,
  so client forms and the API share the same schemas.
- Don't pre-create future API routes, placeholder pages, services, repositories or interfaces.
  Add a layer only when a feature actually needs it.

### `modules/auth` vs `server/auth`

- `src/modules/auth/` — what auth _means_: user / session / password-reset models and (later) the
  rules for sign-up, login, reset and the session lifecycle. May import Mongoose, `server/db`,
  `server/errors`, `server/auth`. Never imports `next/*`.
- `src/server/auth/` — how auth is _carried_: `cookie.ts` (mm_session read/set/clear),
  `token.ts` (random token + SHA-256), `password.ts` (Argon2id). Never imports Mongoose or models;
  no business rules.
- Dependency direction: `modules/auth` → `server/auth`, never the reverse.

## Request pipeline

Route handler → `handler()` (`src/server/http.ts`) → module code → Mongoose.

- `handler()` checks `Origin` on non-GET requests, validates with Zod, maps `AppError` to the
  error format, sets `X-Request-Id` and `Cache-Control: no-store`. Session loading and rate limits
  are added to it with the auth feature.
- Success: `{ "data": ... }` (lists add `nextCursor`); empty success: `204`.
- Error: `{ "error": { code, message, details?, requestId } }` — codes in `src/server/errors.ts`
  (see API Design §2). The client switches on `code`, never on the message.
- Every wedding-scoped query filters on `weddingId`. Roles live in `memberships`, never in the session.

## Database

- Indexes are declared in the model **and** created by a migration (`migrations/`, migrate-mongo,
  native driver). `autoIndex: false` everywhere. Never run migrations in the Vercel build.
- `npm run db:check-indexes` diffs model indexes against the live database.
- migrate-mongo keeps its own bookkeeping in the `migrations` and `migrationsLock` collections.
- New migration: `npm run migrate:create -- <name>`; always write `down` too.
- Scripts importing `src/` run with `tsx --conditions=react-server` (otherwise `server-only` throws).
- Register models as `models.X ?? model(...)` to survive dev hot reload.

## Decisions taken during scaffold planning (override the docs)

- `src/proxy.ts` (Next 16 name) replaces the docs' root `middleware.ts`. It only checks that the
  `mm_session` cookie exists on `/w/*` and redirects to `/login?returnTo=…`; the real check is server-side.
- `notifications`: unique index `{userId, refId, type, threshold}` is **partial** on
  `threshold: { $exists: true }`; plus index 27, TTL 90 days on `readAt` partial on `read: true`.
- `weddings.slug`: plain unique index (no collation).
- Rate limiter (`src/server/rate-limit.ts`, schema + limiter in one file) and its 2 indexes ship
  with the auth feature, not the scaffold.
- HEIC uploads are accepted; Sharp's prebuilt binaries can't decode HEIC, so the photos feature
  must add a conversion path.
- Password change re-issues the current session (it would otherwise be rejected by `passwordChangedAt`).
- Cron cleanup also deletes used/expired team invites older than 30 days.
- No `SESSION_SECRET`: tokens are 256-bit random, a pepper adds nothing.
- CSP without nonces (nonces would force dynamic rendering of cached guest pages).
- Feature-time decisions: `photos/complete` sync vs 202+poll; HEIC conversion approach.

## Commands

| Command                                               | Does                                        |
| ----------------------------------------------------- | ------------------------------------------- |
| `npm run dev`                                         | Start Next.js locally (needs `.env.local`)  |
| `npm run build`                                       | Production build (type errors fail it)      |
| `npm run typecheck`                                   | `tsc --noEmit`                              |
| `npm run format`                                      | Prettier write                              |
| `npm run migrate` / `migrate:down` / `migrate:status` | migrate-mongo against `MIGRATE_MONGODB_URI` |
| `npm run db:check-indexes`                            | Compare model indexes with the database     |

## Conventions

- Collections lower camelCase plural; fields camelCase; enums lowercase strings; `timestamps: true`.
- Files kebab-case (`team-invite.model.ts`). Path alias `@/*` → `src/*`.
- Secrets only in env vars read through `src/server/env.ts`; never `NEXT_PUBLIC_` for secrets.
- Conventional commits (`feat(scope): …`, `chore: …`).
