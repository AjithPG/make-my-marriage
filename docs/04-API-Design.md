# Make My Marriage — API Design (MVP)

Nov 7, 2026 · @Ajith

The MVP exposes one explicit JSON REST API under `/api`, built with Next.js route handlers in the same app as the pages and deployed on Vercel. It is first-party only, authenticated with a server-side session cookie, and every wedding-scoped route lives under `/api/weddings/:weddingId`.

## 1. Conventions

Every endpoint follows the same rules for paths, auth, payloads and paging, so the client can use one small fetch wrapper for all of them.

| Topic | Rule |
| --- | --- |
| Base path | `/api` on the same origin as the app (`https://makemymarriage.in/api`) |
| Implementation | Route handlers in `src/app/api/**/route.ts` exporting `GET`, `POST`, `PATCH`, `PUT`, `DELETE`; Node.js runtime (`export const runtime = 'nodejs'`); every handler wrapped in the shared `handler()` helper |
| Versioning | Unversioned in MVP (first-party client only, deployed together). A breaking change later gets `/api/v2/...` alongside the old routes |
| Style | REST, plural nouns, kebab-case paths, camelCase JSON fields |
| Wedding scope | `/api/weddings/:weddingId/...`; `handler()` loads the caller's membership for that wedding on every request |
| Auth | `mm_session` cookie holding an opaque session token (httpOnly, Secure, SameSite=Lax); no `Authorization` header, no JWTs |
| CSRF | Non-GET requests must send an `Origin` header matching the app origin; others get 403 |
| Content type | `application/json` in and out; `multipart/form-data` only for CSV import |
| Success body | `{ "data": ... }`; lists add `"nextCursor"` |
| Empty success | `204 No Content` for deletes and toggles that return nothing |
| IDs | 24-character hex MongoDB ObjectId strings |
| Timestamps | ISO 8601 UTC, e.g. `2026-12-02T14:05:00Z` |
| Calendar dates and times | `date` as `YYYY-MM-DD`, times as `HH:mm`, both in the wedding's time zone (`Asia/Kolkata`) |
| Pagination | Cursor based: `?limit=50&cursor=<opaque>`; `limit` 1–100, default 50 |
| Partial updates | `PATCH` with only the fields being changed; unknown fields are rejected |
| Caching | API responses send `Cache-Control: no-store`; only guest pages are cached (see section 6) |
| Request id | Every response carries `X-Request-Id`; errors repeat it in the body |

### Roles used in this document

- **Public** — no login needed.
- **User** — any logged-in user.
- **Member** — Admin or Manager of the wedding in the path.
- **Admin** — Admin of that wedding.
- **Creator** — the Admin who created that wedding.

## 2. Errors and status codes

Every error returns one JSON shape with a stable machine-readable `code`; the client switches on `code`, never on the message text.

```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Some fields are invalid.",
    "details": [
      { "path": "venue.mapsUrl", "message": "Must be a Google Maps link" }
    ],
    "requestId": "req_8f3a2c"
  }
}
```

| Status | Code(s) | When |
| --- | --- | --- |
| 400 | `VALIDATION_FAILED`, `BAD_REQUEST` | Body, query or params fail Zod validation; unknown fields |
| 401 | `UNAUTHENTICATED` | No session cookie, or the session is expired, revoked or older than the last password change; the client sends the user to login |
| 401 | `INVALID_CREDENTIALS` | Wrong email or password (same message for unknown email) |
| 401 | `INVALID_PASSWORD` | Wrong current password when changing it |
| 403 | `FORBIDDEN` | Logged in but role not allowed, or not a member of the wedding |
| 403 | `CSRF_ORIGIN_MISMATCH` | Missing or foreign `Origin` on a non-GET request |
| 403 | `CRON_UNAUTHORIZED` | Cron route called without the correct `CRON_SECRET` |
| 404 | `NOT_FOUND` | Resource missing, or in another wedding (never reveal which) |
| 409 | `EMAIL_TAKEN`, `SLUG_TAKEN` | Unique value already used |
| 409 | `INVITE_USED`, `ALREADY_MEMBER` | Team invite already accepted, or user already in the wedding |
| 409 | `LAST_ADMIN` | Removing or demoting the only Admin |
| 410 | `INVITE_EXPIRED`, `RESET_LINK_EXPIRED` | Team invite or password reset link past its expiry, used or revoked |
| 413 | `PAYLOAD_TOO_LARGE` | JSON over 100 KB or CSV over 1 MB |
| 422 | `LIMIT_REACHED` | 15 events, 500 photos, 2,000 guests or 300 to-dos per wedding |
| 422 | `NOT_PUBLISHABLE` | Required fields missing at publish; `details` lists them |
| 429 | `RATE_LIMITED` | Too many requests; `Retry-After` header in seconds |
| 500 | `INTERNAL` | Unexpected error; logged with the request id |

## 3. Endpoint catalogue

The MVP has 61 endpoints in 10 modules. In the tables, `{w}` stands for `/api/weddings/:weddingId`, implemented under `src/app/api/weddings/[weddingId]/`. There is no public JSON API for guests: the guest site is rendered on the server from the service layer.

### 3.1 Auth and account

| Method | Path | Role | Purpose |
| --- | --- | --- | --- |
| POST | `/api/auth/signup` | Public | Create account (name, email, password); no email verification; creates a session and sets `mm_session` |
| POST | `/api/auth/login` | Public | Email + password login; creates a new session and sets the cookie |
| POST | `/api/auth/logout` | User | Delete the current session, clear the cookie |
| POST | `/api/auth/password/forgot` | Public | Email a reset link through Resend (always 204, even for unknown emails) |
| POST | `/api/auth/password/reset` | Public | Set a new password with the token; deletes all the user's sessions |
| GET | `/api/me` | User | Current user, notification preferences, weddings with role |
| PATCH | `/api/me` | User | Update name or notification preferences |
| PUT | `/api/me/password` | User | Change password with the current one; ends other sessions |
| DELETE | `/api/me` | User | Delete account (blocked while creator of a wedding) |

### 3.2 Weddings

| Method | Path | Role | Purpose |
| --- | --- | --- | --- |
| GET | `/api/weddings` | User | Weddings I belong to, with my role |
| POST | `/api/weddings` | User | Create wedding; caller becomes creator Admin; preloads to-dos |
| GET | `/api/slugs/availability?slug=` | User | Check a slug before saving |
| GET | `{w}` | Member | Wedding with draft, published status, counts |
| PATCH | `{w}` | Member | Edit names, wedding date, draft content |
| PATCH | `{w}/settings` | Admin | Slug, gallery visibility, search indexing |
| POST | `{w}/publish` | Admin | Copy draft to published, render invitation images |
| POST | `{w}/unpublish` | Admin | Take the guest site offline |
| DELETE | `{w}` | Creator | Delete wedding and all its data |

### 3.3 Team

| Method | Path | Role | Purpose |
| --- | --- | --- | --- |
| GET | `{w}/members` | Member | List Admins and Managers |
| PATCH | `{w}/members/:userId` | Admin | Change role (admin / manager) |
| DELETE | `{w}/members/:userId` | Admin, or self | Remove a member or leave |
| POST | `{w}/invites` | Admin | Create an invite link for a role; returns the link once |
| GET | `{w}/invites` | Admin | Pending, used and expired invites |
| DELETE | `{w}/invites/:inviteId` | Admin | Revoke an invite |
| GET | `/api/invites/:token` | Public | Preview: couple names, role, still valid or not |
| POST | `/api/invites/:token/accept` | User | Join the wedding |

### 3.4 Events

| Method | Path | Role | Purpose |
| --- | --- | --- | --- |
| GET | `{w}/events` | Member | All events in display order |
| POST | `{w}/events` | Member | Create event (preset or custom) |
| PATCH | `{w}/events/:eventId` | Member | Edit details, venue, YouTube link |
| DELETE | `{w}/events/:eventId` | Member | Delete event and unlink it from guests, to-dos, photos |
| PUT | `{w}/events/order` | Member | Save manual order: `{ ids: [...] }` |

### 3.5 Guests

| Method | Path | Role | Purpose |
| --- | --- | --- | --- |
| GET | `{w}/guests` | Member | List with `search`, `group`, `eventId`, `invited`, `cursor`, `limit` |
| GET | `{w}/guests/summary` | Member | Totals: all, invited, not invited; group names |
| POST | `{w}/guests` | Member | Add one guest |
| POST | `{w}/guests/bulk` | Member | Add many: `{ names: [...], group?, eventIds? }`, up to 500 |
| POST | `{w}/guests/import` | Member | CSV upload (name, inviteName, group); returns created and skipped rows |
| PATCH | `{w}/guests/:guestId` | Member | Edit name, invite name, group, events, notes |
| PATCH | `{w}/guests/:guestId/invited` | Member | `{ invited: true \| false }`; sets or clears `invitedAt` |
| DELETE | `{w}/guests/:guestId` | Member | Delete one guest |
| POST | `{w}/guests/bulk-delete` | Member | `{ ids: [...] }`, up to 500 |

### 3.6 Invitation

| Method | Path | Role | Purpose |
| --- | --- | --- | --- |
| GET | `/api/invitation-designs` | User | Available designs with preview thumbnails |
| GET | `{w}/invitation` | Member | Design, fields, message template, current image URLs |
| PATCH | `{w}/invitation` | Member | Change design, fields or message template |
| POST | `{w}/invitation/preview` | Member | Render a preview PNG without publishing; returns a short-lived URL |

### 3.7 Photos

| Method | Path | Role | Purpose |
| --- | --- | --- | --- |
| POST | `{w}/photos/upload-urls` | Admin | Reserve slots and get presigned R2 PUT URLs (up to 50 per call) |
| POST | `{w}/photos/complete` | Admin | Confirm uploaded photos (up to 10 per call); server processes them with Sharp |
| GET | `{w}/photos` | Member | Gallery with `eventId`, `cursor`, `limit` |
| PATCH | `{w}/photos/:photoId` | Admin | Move to another event or General |
| DELETE | `{w}/photos/:photoId` | Admin | Delete one photo (database + S3) |
| POST | `{w}/photos/bulk-delete` | Admin | `{ ids: [...] }`, up to 100 |

### 3.8 To-dos

| Method | Path | Role | Purpose |
| --- | --- | --- | --- |
| GET | `{w}/todos` | Member | `view=all \| mine \| week \| overdue \| done` |
| POST | `{w}/todos` | Member | Create to-do |
| PATCH | `{w}/todos/:todoId` | Member | Edit, assign, mark done or undone |
| DELETE | `{w}/todos/:todoId` | Member | Delete to-do |
| PUT | `{w}/todos/order` | Member | Save manual order |

### 3.9 Notifications

| Method | Path | Role | Purpose |
| --- | --- | --- | --- |
| GET | `/api/notifications` | User | Computes due reminders, then lists newest first; optional `weddingId` |
| GET | `/api/notifications/unread-count` | User | Number for the bell badge |
| PATCH | `/api/notifications/:notificationId` | User | `{ read: true }` |
| POST | `/api/notifications/read-all` | User | Mark all read (optionally for one wedding) |

### 3.10 System

| Method | Path | Role | Purpose |
| --- | --- | --- | --- |
| GET | `/api/health` | Public | Uptime check; pings MongoDB |
| GET | `/api/cron/cleanup` | Vercel Cron (`Authorization: Bearer <CRON_SECRET>`) | Daily: remove stale pending uploads, release photo slots, clear R2 files of deleted weddings, delete old team invites |

## 4. Request and response examples

Seven examples cover the endpoints with the most rules attached; ids are shortened and values are samples.

### 4.1 Sign up

```http
POST /api/auth/signup
Content-Type: application/json

{ "name": "Ajith", "email": "ajith@example.com", "password": "••••••••••" }
```

```http
201 Created
Set-Cookie: mm_session=…; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=2592000

{ "data": { "id": "6730a0…u1", "name": "Ajith", "email": "ajith@example.com" } }
```

The account works immediately; there is no verification email in V1. Logging out is `POST /api/auth/logout`, which returns 204 and clears the cookie with `Max-Age=0`.

### 4.2 Create a wedding

```http
POST /api/weddings

{ "brideName": "Anu", "groomName": "Ajith", "weddingDate": "2027-02-14" }
```

```http
201 Created

{
  "data": {
    "id": "6730a1…w1",
    "slug": "ajith-anu-2027-02-14",
    "status": "draft",
    "role": "admin",
    "isCreator": true,
    "counts": { "events": 0, "guests": 0, "todos": 25, "photos": 0 }
  }
}
```

### 4.3 List guests with filters

```http
GET /api/weddings/6730a1…w1/guests?invited=false&group=Groom%27s%20side&limit=2
```

```http
200 OK

{
  "data": [
    { "id": "6730a3…g7", "name": "Rajan K", "inviteName": "Rajan Uncle & Family", "group": "Groom's side", "eventIds": ["6730a2…e2"], "invited": false },
    { "id": "6730a3…g8", "name": "Suresh P", "inviteName": null, "group": "Groom's side", "eventIds": ["6730a2…e2", "6730a2…e3"], "invited": false }
  ],
  "nextCursor": "eyJuIjoic3VyZXNoIHAifQ"
}
```

### 4.4 Mark a guest invited

```http
PATCH /api/weddings/6730a1…w1/guests/6730a3…g7/invited

{ "invited": true }
```

```http
200 OK

{ "data": { "id": "6730a3…g7", "invited": true, "invitedAt": "2026-12-02T14:05:00Z" } }
```

### 4.5 Upload photos (two calls)

```http
POST /api/weddings/6730a1…w1/photos/upload-urls

{ "eventId": "6730a2…e2", "files": [ { "contentType": "image/jpeg", "size": 4823011 } ] }
```

```http
200 OK

{
  "data": [
    {
      "photoId": "6730a4…p1",
      "uploadUrl": "https://<account-id>.r2.cloudflarestorage.com/mm-prod/originals/6730a1…w1/…?X-Amz-Signature=…",
      "headers": { "Content-Type": "image/jpeg" },
      "expiresAt": "2026-12-02T14:10:00Z"
    }
  ]
}
```

After the browser PUTs each file to its `uploadUrl`:

```http
POST /api/weddings/6730a1…w1/photos/complete

{ "photoIds": ["6730a4…p1"] }
```

```http
202 Accepted

{ "data": [ { "photoId": "6730a4…p1", "status": "pending" } ] }
```

The client polls `GET {w}/photos` (or refreshes) until the status is `ready`. Calling `complete` twice for the same id is safe.

### 4.6 Publish with missing fields

```http
POST /api/weddings/6730a1…w1/publish
```

```http
422 Unprocessable Entity

{
  "error": {
    "code": "NOT_PUBLISHABLE",
    "message": "Add the missing details before publishing.",
    "details": [
      { "path": "events", "message": "Add at least one event" },
      { "path": "invitation.designId", "message": "Choose an invitation design" }
    ],
    "requestId": "req_91bc04"
  }
}
```

### 4.7 Accept a team invite

```http
GET /api/invites/Q2x1ZS1zYW1wbGUtdG9rZW4
```

```http
200 OK

{ "data": { "brideName": "Anu", "groomName": "Ajith", "role": "manager", "valid": true, "expiresAt": "2026-12-09T09:00:00Z" } }
```

```http
POST /api/invites/Q2x1ZS1zYW1wbGUtdG9rZW4/accept
```

```http
200 OK

{ "data": { "weddingId": "6730a1…w1", "role": "manager" } }
```

## 5. Validation rules and limits

All rules live in shared Zod schemas (`shared/schemas`), so the form and the API reject the same input with the same message.

### Field rules

| Field | Rule |
| --- | --- |
| email | Valid email, lowercased, max 254 chars |
| password | 8–128 chars; rejected if in a common-password list |
| name, brideName, groomName | 1–60 chars, trimmed |
| slug | 3–80 chars, `^[a-z0-9]+(-[a-z0-9]+)*$`, not reserved (`api`, `login`, `w`, `admin`, …) |
| weddingDate, event date | `YYYY-MM-DD`; not more than 3 years ahead |
| startTime, endTime | `HH:mm`, 24-hour; `endTime` after `startTime` when both set |
| mapsUrl | `https`, host `maps.app.goo.gl`, `goo.gl` or `google.com/maps` |
| youtubeUrl | Host `youtube.com`, `youtu.be` or `youtube-nocookie.com`; a video id must be extractable |
| guest name / inviteName | 1–100 chars |
| group | Up to 40 chars |
| messageTemplate | Up to 1,000 chars; must contain `{link}`; only known placeholders allowed |
| todo title | 1–200 chars |
| photo upload | `image/jpeg`, `image/png`, `image/webp`, `image/heic`; up to 20 MB each |
| CSV import | Up to 1 MB and 2,000 rows; header row required |

### Limits

| Limit | Value | Error |
| --- | --- | --- |
| Events per wedding | 15 | 422 `LIMIT_REACHED` |
| Guests per wedding | 2,000 | 422 `LIMIT_REACHED` |
| Photos per wedding | 500 | 422 `LIMIT_REACHED` |
| To-dos per wedding | 300 | 422 `LIMIT_REACHED` |
| Items per bulk call | 500 guests, 50 upload URLs, 10 photos per `complete`, 100 photo deletes | 400 `VALIDATION_FAILED` |
| JSON body | 100 KB (photos never pass through the API, so Vercel's request-size limit doesn't apply to them) | 413 `PAYLOAD_TOO_LARGE` |

### Rate limits

| Endpoint group | Limit | Key |
| --- | --- | --- |
| `POST /api/auth/login` | 5 per 15 min | email and IP, separately |
| `POST /api/auth/signup` | 3 per hour | IP |
| `POST /api/auth/password/forgot` | 3 per hour | IP and email |
| `PUT /api/me/password` | 5 per hour | user |
| `photos/upload-urls` | 20 per min | user |
| `invitation/preview` | 10 per min | user |
| All other `/api` routes | 300 per min | user, or IP when logged out |

Counters live in MongoDB (`rateLimits`), because Vercel functions share no memory between instances.

## 6. Client integration notes

Four client behaviours are easy to get wrong; each needs a test.

### Sessions

1. The browser sends the `mm_session` cookie automatically on same-origin `fetch` calls; there is no token refresh step.
2. Any 401 `UNAUTHENTICATED` from the API sends the user to `/login?returnTo=<current path>`.
3. Server components and layouts call `getSession()` (reading the cookie with `cookies()`) and `redirect('/login')` when there is no valid session.
4. `middleware.ts` only checks that the cookie exists to redirect early from `/w/*`; it never trusts the cookie on its own.

### WhatsApp invite

1. The guest list response already includes what the message needs (invite name, couple names, date, site link) and the invitation's template is loaded with the page.
2. On tap, the browser builds the message and calls `window.open('https://wa.me/?text=' + encodeURIComponent(message))` synchronously, so mobile browsers don't block it as a popup.
3. Right after, it sends `PATCH {w}/guests/:guestId/invited` and updates the row optimistically; on failure it reverts and shows an error.
4. Undo sends `{ invited: false }`.

### Photo upload

- Request URLs in batches of up to 50, upload at most 4 files in parallel straight to R2, retry a failed PUT twice.
- Call `complete` in batches of up to 10 photo ids, so each Vercel function call stays well within its time limit.
- HEIC files from iPhones are uploaded as-is; the server converts them.
- Presigned URLs expire after 5 minutes: request them just before uploading, not when files are first picked.
- Reserved slots that never reach `complete` are released by the daily cron job.

### Guest pages and caching

- `/<slug>` is server-rendered from services, not from `/api`, and cached by Next.js with the tag `wedding:<id>`.
- Publish, unpublish and content edits call `revalidateTag('wedding:<id>')`, so guests see the change on their next visit.
- Open Graph tags point at the versioned invitation PNG in R2, so WhatsApp picks up a new image after each publish.

### Related documents

- Make My Marriage — Product Requirements Document (MVP) — features, roles and acceptance criteria
- Make My Marriage — System Design (MVP) — module layout, request flows, security
- Make My Marriage — Database Design (MVP) — collections, indexes, limits
