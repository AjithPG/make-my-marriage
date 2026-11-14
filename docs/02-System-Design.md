# Make My Marriage — System Design (MVP)

Nov 6, 2026 · @Ajith

Make My Marriage is a modular monolith: one Next.js application on Vercel holds the pages, an explicit REST API built with route handlers, and scheduled jobs, with MongoDB Atlas for data, Cloudflare R2 for media and Resend for email. There is no separate Express or NestJS backend.

## 1. Architecture at a glance

Every request lands on one Next.js deployment. Pages render on the server and read through the service layer directly; browser actions call the REST API under `/api/*`, implemented as route handlers on the Node.js runtime. Both share one set of modules, the only code that touches MongoDB, R2 and Resend.

&#91;embedded content: system architecture · Next.js modular monolith on Vercel\]

Three things skip the functions: photo files go from the Admin's browser straight to R2 with presigned URLs, guests load images from R2's public media domain, and the live stream comes from YouTube. Client components call `/api/*` with `fetch`; mutations always go through the REST API, never through server actions.

## 2. Tech stack and tools

One TypeScript codebase, one Next.js app, one Vercel project. Items marked "suggested" are my picks where no choice was made yet.

| Layer | Choice | Notes |
| --- | --- | --- |
| Language | TypeScript (strict) everywhere | Pages, route handlers, modules and shared schemas |
| Framework | Next.js, App Router | One app for the marketing site, auth pages, dashboard and guest sites |
| Backend | Next.js route handlers (`app/api/**/route.ts`) | Explicit REST API on the Node.js runtime; no Express or NestJS |
| Architecture | Modular monolith | Feature modules with services + repositories, framework-free |
| UI | Tailwind CSS + shadcn/ui | Design tokens from the Figma file |
| Validation | Zod | Same schemas validate forms and API input |
| Database | MongoDB Atlas, Mumbai region (ap-south-1) | Free tier for development, M10 for production |
| ODM | Mongoose | Cached connection reused across function invocations |
| Auth | Custom email + password | Argon2id hashing (`@node-rs/argon2`, suggested); no email verification in V1 |
| Sessions | Server-side sessions in MongoDB | Opaque token in an httpOnly, Secure, SameSite=Lax cookie |
| Media storage | Cloudflare R2 | S3-compatible API via `@aws-sdk/client-s3` + presigner; public media on a custom domain such as `media.makemymarriage.in` |
| Image processing | Sharp in a route handler | Resize, WebP, strip EXIF, thumbnails |
| Invitation PNG | `next/og` (ImageResponse) | Built into Next.js and Vercel |
| Email | Resend | Password reset only in V1 |
| Hosting | Vercel | Git-based deploys, preview deployment for every pull request, functions pinned to Mumbai (`bom1`) |
| Scheduled jobs | Vercel Cron | Defined in `vercel.json`, secured with `CRON_SECRET` |
| Secrets | Vercel environment variables | Separate values for development, preview and production |
| Monitoring | Vercel logs; Sentry later (suggested) | Logger and tests are deferred for now |

## 3. Inside the monolith

Each feature is a module with its own service, repository and schemas; route handlers stay thin and modules never import from Next.js, so the business logic could move to another runtime later without a rewrite.

### Layers

1. **Route handlers** (`src/app/api/**/route.ts`): one file per resource, exporting `GET`, `POST`, `PATCH`, `DELETE`. Each wraps its work in a shared `handler()` helper.
2. **`handler()` wrapper** (`src/server/http.ts`): loads the session, checks the `Origin` header on non-GET requests, validates body/query/params with Zod, applies rate limits, maps thrown `AppError`s to the API error format and sets the `X-Request-Id` header.
3. **Services** (`src/modules/*/*.service.ts`): all business rules and permission checks (for example, only Admins publish). Used by route handlers, by server components for reads, and by cron jobs.
4. **Repositories** (`src/modules/*/*.repo.ts`): the only code that touches Mongoose; every wedding-scoped query takes a `weddingId`.

Server components may call services directly for reads (the guest site, dashboard pages). All writes go through the REST API; server actions are not used.

### Modules

| Module | Owns |
| --- | --- |
| auth | sign-up, login, logout, sessions, password reset |
| team | memberships, Manager / co-admin invite links |
| weddings | couple details, slug, publish / unpublish, delete |
| events | events, venues, maps links, YouTube links |
| guests | guest list, groups, invited flag, bulk add, CSV import |
| invitations | designs, message template, PNG rendering |
| photos | presigned R2 uploads, Sharp processing, gallery visibility |
| todos | checklist, preloaded Kerala template |
| notifications | computed reminders, activity, read state |
| public-site | read-only view of published weddings for guests |

### Folder structure

```text
make-my-marriage/
├─ src/
│  ├─ app/
│  │  ├─ (marketing)/page.tsx          # landing page
│  │  ├─ (auth)/login, signup, reset    # auth pages
│  │  ├─ (app)/w/[weddingId]/...        # Admin / Manager dashboard
│  │  ├─ [slug]/page.tsx                # public guest site
│  │  └─ api/
│  │     ├─ auth/{signup,login,logout,password}/route.ts
│  │     ├─ me/route.ts
│  │     ├─ weddings/[weddingId]/{events,guests,photos,todos,...}/route.ts
│  │     ├─ notifications/route.ts
│  │     ├─ cron/{cleanup}/route.ts
│  │     └─ health/route.ts
│  ├─ modules/
│  │  ├─ auth/        # auth.service.ts, auth.repo.ts, auth.schemas.ts, models/
│  │  ├─ weddings/  events/  guests/  invitations/
│  │  └─ photos/  todos/  notifications/  team/  public-site/
│  ├─ server/        # server-only infrastructure
│  │  ├─ db.ts        # cached Mongoose connection
│  │  ├─ env.ts       # Zod-validated environment
│  │  ├─ http.ts      # handler(), AppError, response helpers
│  │  ├─ session.ts   # create / read / revoke sessions, cookie helpers
│  │  ├─ r2.ts        # S3 client for R2, presigned URLs
│  │  ├─ email.ts     # Resend client and templates
│  │  └─ rate-limit.ts
│  ├─ components/      # ui/ (shadcn), layout/, feature components
│  └─ lib/             # client-safe utilities, API fetch wrapper
├─ middleware.ts       # redirect logged-out users away from /w/*
├─ vercel.json         # cron schedules, function region
└─ docs/               # PRD, system, database, API design
```

Every file in `src/server` and `src/modules` starts with `import 'server-only'`, so a build fails if client code tries to import it.

### Collections changed by this design

On top of the Database Design: `sessions` (userId, tokenHash, expiresAt, lastSeenAt, userAgent; TTL on `expiresAt`), `passwordResets` (userId, tokenHash, expiresAt, usedAt; TTL) and `rateLimits` (key, count, expiresAt; TTL). The refresh-token family fields and email-verification tokens are no longer needed.

## 4. Key request flows

Seven flows cover every risky path in the MVP; each becomes an end-to-end test once testing is set up.

### 4.1 Guest opens a wedding site

1. Guest taps the link in WhatsApp; WhatsApp has already read the page's Open Graph tags and shows the invitation PNG as the preview.
2. Vercel serves `/<slug>`; the `[slug]` page calls `publicSite.getPublishedWedding(slug)` directly.
3. The service returns only published content; unpublished or unknown slugs return the 404 page; old slugs redirect.
4. The page is cached and tagged `wedding:<id>`; publishing, unpublishing or editing calls `revalidateTag`, so guests always see the latest published version.
5. Photos load from the R2 media domain; the YouTube player loads via `youtube-nocookie.com`.

### 4.2 Sign up (no email verification in V1)

1. Browser posts `{ name, email, password }` to `POST /api/auth/signup`; the rate limit checks the IP.
2. Service checks the email isn't taken, hashes the password with Argon2id and creates the user.
3. Service creates a session and sets the `mm_session` cookie; the response is 201 and the user goes straight to "Create your wedding".

### 4.3 Log in, every request, log out

1. `POST /api/auth/login` verifies the password (same error for unknown email or wrong password), creates a new session and sets the cookie. Old sessions on other devices stay valid.
2. On every API request, `handler()` reads the cookie, hashes the token, loads the matching unexpired session and its user. If `lastSeenAt` is more than a day old, it extends the session (sliding expiry).
3. `POST /api/auth/logout` deletes the session document and clears the cookie.
4. `middleware.ts` only checks that the cookie exists, to redirect logged-out visitors from `/w/*` to `/login`; the real session check always happens in `handler()` or the page's server code.

### 4.4 Forgot password

1. `POST /api/auth/password/forgot` always returns 204. If the email exists, the service stores a hashed reset token (30 minutes) and sends the link with Resend.
2. `POST /api/auth/password/reset` checks the token, sets the new password, marks the token used and deletes all of that user's sessions.

### 4.5 Invite a guest over WhatsApp

1. Admin or Manager taps Invite on a guest row.
2. The browser fills the message template and opens `https://wa.me/?text=<encoded>` in the same tap, so mobile browsers don't block it.
3. It then calls `PATCH /api/weddings/:id/guests/:guestId/invited` with `true`; the UI updates optimistically. Undo within 5 seconds sends `false`.

### 4.6 Admin uploads photos

1. Browser asks `POST /api/weddings/:id/photos/upload-urls` for presigned R2 PUT URLs (Admin only; checks the 500-photo cap, 20 MB per file and allowed types).
2. Browser uploads each file straight to R2 under `originals/<weddingId>/<uuid>`. Files never pass through a Vercel function, so its request-size limit doesn't apply.
3. Browser calls `POST /api/weddings/:id/photos/complete` in batches of up to 10 photo ids, so each call stays well inside function time limits.
4. The route handler downloads each original, runs Sharp (rotate, strip EXIF, 2000 px WebP + 400 px thumbnail), writes to `media/<weddingId>/...` and marks the photo ready.
5. Originals are deleted after processing; the daily cron removes any left behind.

### 4.7 Publish and regenerate the invitation

1. Admin taps Publish: `POST /api/weddings/:id/publish`.
2. Service validates required fields and copies draft content to published.
3. A `next/og` ImageResponse renders the invitation at 1080 × 1350 and 1200 × 630; both PNGs go to R2 with a new version in the key.
4. Service calls `revalidateTag('wedding:<id>')`, so the guest page and its Open Graph image update immediately.

### 4.8 Scheduled jobs (Vercel Cron)

| Job | Schedule | Does |
| --- | --- | --- |
| `/api/cron/cleanup` | Daily, 03:00 IST | Deletes unprocessed originals and `pending` photos older than 24 h, releases unused photo slots, removes R2 files of deleted weddings |

Each cron route rejects requests without the `Authorization: Bearer <CRON_SECRET>` header that Vercel sends. Reminders stay computed on page load; a cron job can pre-compute them later if notifications ever leave the app.

## 5. Authentication and security design

Authentication is custom email + password with server-side sessions stored in MongoDB; the cookie holds only a random token, so any session can be revoked instantly.

### Passwords and sessions

| Item | Design |
| --- | --- |
| Password hashing | Argon2id via `@node-rs/argon2` (prebuilt binaries that run on Vercel); bcrypt cost 12 as fallback |
| Password rules | 8–128 characters; rejected if in a common-password list |
| Session token | 256-bit random value, base64url; only its SHA-256 hash is stored in `sessions` |
| Cookie | `mm_session`: httpOnly, Secure, SameSite=Lax, Path=/, Max-Age 30 days |
| Expiry | Sliding 30 days (extended at most once a day), absolute limit 90 days |
| New session | On sign-up and every login; nothing about the user or role is stored in the cookie |
| Logout | Deletes that session document and clears the cookie |
| Password reset | Token valid 30 minutes, single use, stored hashed; on success all the user's sessions are deleted |
| Email verification | Not in V1; accounts are usable immediately after sign-up |

### Authorization

- Roles live in `memberships`, never in the session. Every wedding-scoped request loads the caller's membership for the `weddingId` in the URL, so removing a Manager takes effect on their next request.
- Services re-check the role for sensitive actions (publish, photos, team, delete), even when the route already did.
- Repository helpers require a `weddingId`, so an unscoped query fails at compile time.

### Request protection

- CSRF: SameSite=Lax cookies plus an `Origin` check in `handler()` for every non-GET `/api` request.
- Rate limits stored in MongoDB (`rateLimits`), because serverless functions share no memory: login 5 per 15 min per email and per IP, sign-up and forgot-password 3 per hour per IP, upload URLs 20 per minute per user.
- Account enumeration: login and forgot-password return the same response whether or not the email exists. Sign-up has to say "email already in use", so it carries the strictest rate limit.
- Zod validation on every body, query and param; unknown fields rejected.
- Security headers and a Content-Security-Policy set in `next.config` (YouTube and the R2 media domain allowed).
- Secrets only in Vercel environment variables and only read in `src/server`; nothing secret uses the `NEXT_PUBLIC_` prefix.

### Media privacy on R2

- Originals live under `originals/`, never public, deleted after processing.
- Processed images live under `media/` with random UUID keys and are served from the public media domain. The API only returns their URLs when the gallery is visible, but a URL someone already copied keeps working after the gallery is hidden.
- Presigned upload URLs expire in 5 minutes and are locked to content type and size. If stricter privacy is needed later, switch `media/` to short-lived signed URLs.

## 6. Deployment and environments

Vercel deploys straight from GitHub: every pull request gets its own preview URL, and every merge to `main` goes to production with instant rollback.

### Environments

| Environment | Trigger | Database | Media | Domain |
| --- | --- | --- | --- | --- |
| Local | `npm run dev` | Atlas free cluster (or local MongoDB) | R2 dev bucket | `localhost:3000` |
| Preview | Every pull request | Atlas staging cluster | R2 staging bucket | `*.vercel.app` preview URL |
| Production | Merge to `main` | Atlas M10, daily backups, 7-day retention | R2 production bucket + media domain | `makemymarriage.in` |

### Vercel project setup

- Framework preset: Next.js; Node.js runtime for all route handlers (Mongoose and Sharp need Node, not Edge).
- Function region `bom1` (Mumbai), next to the Atlas cluster in ap-south-1.
- `vercel.json` holds the cron schedule. Vercel Cron runs only on production deployments; the Hobby plan allows only daily jobs, so Pro is the safer plan for a live product.
- Environment variables set per environment: `MONGODB_URI`, `SESSION_SECRET` (optional pepper), `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_URL`, `RESEND_API_KEY`, `EMAIL_FROM`, `APP_URL`, `CRON_SECRET`.

### External services

- **MongoDB Atlas:** Vercel functions don't have fixed IP addresses, so the network access list allows all IPs and security rests on a strong, app-only database user over TLS. Revisit with Vercel's static IP option if needed.
- **Mongoose connection:** cached on a global so warm invocations reuse it; `maxPoolSize` around 5 per instance to keep Atlas connection counts low.
- **Cloudflare R2:** one bucket per environment, an R2 API token scoped to that bucket, a custom media domain for public images, and a CORS rule allowing PUT from the app's origins.
- **Resend:** verify the sending domain (SPF/DKIM DNS records) before launch.
- **DNS:** the domain can live on Cloudflare (simplest with R2) with records pointing the apex to Vercel.

### Checks before merging

Vercel's build runs `next build` (type errors fail the build). Lint, automated tests and a GitHub Actions workflow come later, when testing is set up.

## 7. Trade-offs and scaling path

One Next.js app on Vercel is the lightest setup a solo developer can run; each known limit has a next step that doesn't need a rewrite, because the modules don't depend on Next.js.

| Choice | Why it fits now | Cost | Next step when needed |
| --- | --- | --- | --- |
| Route handlers instead of Express/NestJS | One framework, one deployment, native on Vercel | No Express middleware ecosystem; we maintain a small `handler()` wrapper | Move modules behind a separate API service if the API outgrows Next.js |
| Server-side sessions in MongoDB | Instant revocation, simple to reason about, nothing sensitive in the cookie | One database lookup per authenticated request | Cache sessions in Upstash Redis if load grows |
| No email verification in V1 | Fastest sign-up | Typos lock users out of password reset; someone could register with another person's email | Add verification in v1.1 and require it before publishing |
| Vercel serverless functions | No servers to run, preview deploys, instant rollback | Cold starts, function time and memory limits, request-size limit, no fixed IPs for Atlas | Static IPs for Atlas; a background queue for heavy work |
| Sharp inside a route handler | No extra infrastructure | Big photo batches use function time | Process from a queue (for example Upstash QStash) or use Cloudflare Images |
| Cloudflare R2 | S3-compatible, no egress fees for guest traffic | Public media URLs stay reachable once copied | Signed URLs for hidden galleries |
| Vercel Cron | Built in, configured in one file | Frequency limited by plan; runs only in production | Upgrade the plan or move jobs to QStash schedules |
| Rate limits in MongoDB | No extra service | Slower than in-memory or Redis | Upstash Redis rate limiting |

Watch these numbers in production: function duration on photo processing, p95 API latency (target under 300 ms), Atlas connection count, R2 storage per wedding and cron job failures.
