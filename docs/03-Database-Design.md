# Make My Marriage — Database Design (MVP)

Nov 7, 2026 · @Ajith

The MVP stores all application data in one MongoDB Atlas database, `makemymarriage`, across 13 collections, accessed with Mongoose from Next.js route handlers on Vercel. Every collection except the auth ones is scoped by `weddingId`; images live in Cloudflare R2 and only their object keys are stored here.

## 1. Modelling principles

The design favours one collection per entity with references by `ObjectId`, and embeds only small, bounded data that is always read with its parent.

### Tenancy

- A wedding is the tenant. Every wedding-owned document carries `weddingId`, and every repository query filters on it.
- Users are global: one account can belong to several weddings through `memberships`.
- Guests are not users and never authenticate.

### Embed or reference

| Data | Decision | Reason |
| --- | --- | --- |
| Couple details, published snapshot, previous slugs | Embed in `weddings` | Small, bounded, always read with the wedding |
| Venue on an event | Embed in `events` | One venue per event, no reuse needed in MVP |
| Events, guests, photos, to-dos | Separate collections | Unbounded or large (up to 500 photos, hundreds of guests); paged and filtered independently |
| Guest → events | Array of `eventIds` on `guests` | At most 15 events per wedding, so the array stays small |
| Invitation design + message template | One `invitations` document per wedding | 1:1 with wedding but edited and versioned on its own |
| Notification preferences | Embed in `users` | Per user, tiny |

### Conventions

- Collection names: lower camelCase plural (`teamInvites`). Field names: camelCase.
- `_id`: MongoDB `ObjectId` everywhere.
- Every document has `createdAt` and `updatedAt` (Mongoose `timestamps: true`).
- Dates stored as UTC `Date`. Event times stored as `HH:mm` strings in the wedding's time zone (`Asia/Kolkata`) because they are wall-clock times.
- Enums stored as lowercase strings (`'admin'`, `'manager'`).
- Secrets and tokens stored only as SHA-256 hashes; passwords as Argon2id hashes.
- No soft delete in MVP: a delete removes the document (see section 6).
- MongoDB `$jsonSchema` validators mirror the Mongoose schemas as a second line of defence.

## 2. Entity relationship diagram

The wedding is the hub: users reach it only through memberships, and the five content collections each belong to one wedding.

&#91;embedded content: entity relationships · 13 collections\]

Not drawn, to keep the picture readable: `todos`, `photos` and `notifications` can also point to an event, `todos.assigneeId` points to a user, and `notifications.userId` names the recipient.

## 3. Collection schemas

Every collection below also has `_id`, `createdAt` and `updatedAt`, which are left out of the tables. "Req" = required on insert.

### 3.1 users

| Field | Type | Req | Notes |
| --- | --- | --- | --- |
| email | string | Yes | Lowercased, trimmed, unique; not verified in V1 |
| passwordHash | string | Yes | Argon2id |
| name | string | Yes | 1–80 chars |
| passwordChangedAt | date | No | Set on password reset; sessions created earlier are rejected |
| notificationPrefs | object | Yes | `{ eventReminders: true, todoReminders: true, activity: true }` |
| lastLoginAt | date | No |  |

### 3.2 sessions

| Field | Type | Req | Notes |
| --- | --- | --- | --- |
| userId | ObjectId → users | Yes |  |
| tokenHash | string | Yes | SHA-256 of the random token in the `mm_session` cookie; unique |
| expiresAt | date | Yes | Sliding: last activity + 30 days, extended at most once a day, never past `absoluteExpiresAt`; TTL index |
| absoluteExpiresAt | date | Yes | Creation + 90 days |
| lastSeenAt | date | Yes | Updated when the session is extended |
| userAgent, ip | string | No | For a future "active sessions" screen |

### 3.3 passwordResets

| Field | Type | Req | Notes |
| --- | --- | --- | --- |
| userId | ObjectId → users | Yes |  |
| tokenHash | string | Yes | SHA-256 of the token in the emailed link; unique |
| expiresAt | date | Yes | Creation + 30 minutes; TTL index |
| usedAt | date | No | Single use |

### 3.4 rateLimits

| Field | Type | Req | Notes |
| --- | --- | --- | --- |
| key | string | Yes | e.g. `login:email:ajith@…`, `login:ip:1.2.3.4`; unique |
| count | int | Yes | Incremented with `$inc` + upsert |
| expiresAt | date | Yes | End of window; TTL index |

### 3.5 weddings

| Field | Type | Req | Notes |
| --- | --- | --- | --- |
| slug | string | Yes | `bride-groom-YYYY-MM-DD`, lowercase, `[a-z0-9-]`, 3–80 chars; unique |
| previousSlugs | array of `{ slug, redirectUntil }` | No | Old URLs redirect for 30 days |
| brideName, groomName | string | Yes | 1–60 chars each |
| weddingDate | date | Yes | Date of the main ceremony |
| timeZone | string | Yes | Default `Asia/Kolkata` |
| draft | object | Yes | Editable content: `{ story, brideFamily, groomFamily, couplePhotoKey, contactNote }`; `couplePhotoKey` is an R2 key under `media/<weddingId>/` |
| published | object | No | Snapshot of `draft` taken at publish; what guests see |
| status | enum `draft` \| `published` \| `unpublished` \| `deleting` | Yes | Default `draft`; `deleting` while the daily cron removes R2 files |
| publishedAt | date | No | Last publish |
| deletingAt | date | No | Set when the creator deletes the wedding |
| galleryVisible | boolean | Yes | Default `false` |
| searchIndexable | boolean | Yes | Default `false` (`noindex`) |
| photoCount | int | Yes | Default 0; maintained with `$inc` to enforce the 500 cap |
| createdBy | ObjectId → users | Yes | The creator Admin |

### 3.6 memberships

| Field | Type | Req | Notes |
| --- | --- | --- | --- |
| weddingId | ObjectId → weddings | Yes |  |
| userId | ObjectId → users | Yes | Unique together with `weddingId` |
| role | enum `admin` \| `manager` | Yes |  |
| isCreator | boolean | Yes | Exactly one `true` per wedding |
| invitedBy | ObjectId → users | No |  |

### 3.7 teamInvites

| Field | Type | Req | Notes |
| --- | --- | --- | --- |
| weddingId | ObjectId → weddings | Yes |  |
| role | enum `admin` \| `manager` | Yes | `admin` = co-admin invite |
| tokenHash | string | Yes | Unique |
| expiresAt | date | Yes | Creation + 7 days |
| usedAt, usedBy | date, ObjectId → users | No | Single use |
| revokedAt | date | No | Admin can revoke early |
| createdBy | ObjectId → users | Yes |  |

### 3.8 events

| Field | Type | Req | Notes |
| --- | --- | --- | --- |
| weddingId | ObjectId → weddings | Yes | Max 15 per wedding |
| preset | enum `engagement` \| `mehendi` \| `haldi` \| `wedding` \| `reception` \| `custom` | Yes |  |
| name | string | Yes | Pre-filled from preset; 1–60 chars |
| date | date | Yes |  |
| startTime | string `HH:mm` | Yes |  |
| endTime | string `HH:mm` | No |  |
| muhurtham | string | No | Free text, e.g. "10:30 – 11:15 AM"; shown prominently |
| venue | object | No | `{ name, address, mapsUrl }`; `mapsUrl` must be a Google Maps URL |
| description | string | No | Up to 1,000 chars |
| youtubeUrl, youtubeVideoId | string | No | ID extracted on save |
| order | int | Yes | Manual sort; default by date + time |

### 3.9 guests

| Field | Type | Req | Notes |
| --- | --- | --- | --- |
| weddingId | ObjectId → weddings | Yes |  |
| name | string | Yes | 1–100 chars |
| nameLower | string | Yes | Lowercased copy for search and sort |
| inviteName | string | No | e.g. "Rajan Uncle & Family"; falls back to `name` |
| group | string | No | e.g. "Bride's side"; free text with suggestions |
| eventIds | array of ObjectId → events | Yes | Default `[]` |
| invited | boolean | Yes | Default `false` |
| invitedAt | date | No | Set on Invite tap; cleared on undo |
| invitedBy | ObjectId → users | No |  |
| notes | string | No | Up to 500 chars |

No phone, email or address fields exist, by design.

### 3.10 invitations

| Field | Type | Req | Notes |
| --- | --- | --- | --- |
| weddingId | ObjectId → weddings | Yes | Unique (one per wedding) |
| designId | string | Yes | e.g. `kasavu-gold`; designs live in code |
| fields | object | Yes | `{ headline, coupleLine, dateLine, venueLine, body }` |
| messageTemplate | string | Yes | With `{inviteName}`, `{bride}`, `{groom}`, `{date}`, `{link}`; up to 1,000 chars |
| version | int | Yes | Incremented on each render |
| imageKeys | object | No | `{ download: '…-v3-1080x1350.png', preview: '…-v3-1200x630.png' }` |
| renderedAt | date | No |  |

### 3.11 photos

| Field | Type | Req | Notes |
| --- | --- | --- | --- |
| weddingId | ObjectId → weddings | Yes |  |
| eventId | ObjectId → events | No | `null` = General |
| status | enum `pending` \| `ready` \| `failed` | Yes | `pending` from upload URL until Sharp finishes |
| originalKey | string | Yes | R2 key `originals/<weddingId>/<uuid>`; private, deleted after processing |
| imageKey, thumbKey | string | No | R2 keys `media/<weddingId>/<uuid>.webp` and `…_thumb.webp`, served from the public media domain |
| width, height | int | No | Of the processed image |
| bytes | int | No | Processed size, for storage tracking |
| uploadedBy | ObjectId → users | Yes |  |

### 3.12 todos

| Field | Type | Req | Notes |
| --- | --- | --- | --- |
| weddingId | ObjectId → weddings | Yes |  |
| title | string | Yes | 1–200 chars |
| dueDate | date | No |  |
| assigneeId | ObjectId → users | No | Must be a member of the wedding |
| eventId | ObjectId → events | No |  |
| done | boolean | Yes | Default `false` |
| doneAt | date | No |  |
| templateKey | string | No | Set for preloaded checklist items |
| order | int | Yes |  |

### 3.13 notifications

| Field | Type | Req | Notes |
| --- | --- | --- | --- |
| userId | ObjectId → users | Yes | Recipient |
| weddingId | ObjectId → weddings | Yes |  |
| type | enum `eventReminder` \| `todoDue` \| `todoOverdue` \| `eventChanged` \| `photosUploaded` \| `memberJoined` | Yes |  |
| refType | enum `event` \| `todo` \| `photo` \| `membership` | Yes |  |
| refId | ObjectId | Yes |  |
| threshold | string | No | `7d`, `3d`, `1d`, `due`, `overdue`; makes reminders idempotent |
| message | string | Yes | Rendered text, e.g. "Your wedding ceremony is in 3 days" |
| read | boolean | Yes | Default `false` |
| readAt | date | No |  |

## 4. Indexes and the queries they serve

### Query notes

26 indexes cover every MVP query without a collection scan, including the per-request session lookup and the daily cleanup job; each is declared in the Mongoose schema and built by a migration script, with `autoIndex: false` in production.

| Collection | Index | Options | Serves |
| --- | --- | --- | --- |
| users | `{ email: 1 }` | unique | Login, sign-up duplicate check, forgot password |
| sessions | `{ tokenHash: 1 }` | unique | Session lookup on every authenticated request |
| sessions | `{ userId: 1 }` |  | Delete all of a user's sessions after password reset or account deletion |
| sessions | `{ expiresAt: 1 }` | TTL 0 s | Auto-delete expired sessions |
| passwordResets | `{ tokenHash: 1 }` | unique | Reset password |
| passwordResets | `{ expiresAt: 1 }` | TTL 0 s | Auto-delete |
| rateLimits | `{ key: 1 }` | unique | Upsert + `$inc` |
| rateLimits | `{ expiresAt: 1 }` | TTL 0 s | Window reset |
| weddings | `{ slug: 1 }` | unique, collation strength 2 | Guest site lookup |
| weddings | `{ 'previousSlugs.slug': 1 }` |  | Old-URL redirect |
| weddings | `{ status: 1 }` | partial (`status: 'deleting'`) | Daily cron: weddings waiting for R2 cleanup |
| memberships | `{ weddingId: 1, userId: 1 }` | unique | Permission check on every wedding request |
| memberships | `{ userId: 1 }` |  | "Your weddings" list |
| teamInvites | `{ tokenHash: 1 }` | unique | Accept invite link |
| teamInvites | `{ weddingId: 1, createdAt: -1 }` |  | Team page: pending invites; cron cleanup of old invites |
| events | `{ weddingId: 1, date: 1, startTime: 1 }` |  | Event list, guest site, reminders |
| guests | `{ weddingId: 1, nameLower: 1 }` |  | Guest list sorted by name, prefix search |
| guests | `{ weddingId: 1, invited: 1 }` |  | Invited / not-invited filter and counter |
| guests | `{ weddingId: 1, group: 1 }` |  | Group filter |
| guests | `{ weddingId: 1, eventIds: 1 }` | multikey | Event filter |
| invitations | `{ weddingId: 1 }` | unique | One invitation per wedding |
| photos | `{ weddingId: 1, eventId: 1, createdAt: -1 }` |  | Gallery by event, newest first |
| photos | `{ status: 1, createdAt: 1 }` |  | Daily cron: stale `pending` uploads |
| todos | `{ weddingId: 1, done: 1, dueDate: 1 }` |  | To-do views, due-soon and overdue reminders |
| notifications | `{ userId: 1, refId: 1, type: 1, threshold: 1 }` | unique | Idempotent reminders |
| notifications | `{ userId: 1, read: 1, createdAt: -1 }` |  | Bell list and unread count |

### Query notes

- **Session lookup:** one `findOne({ tokenHash, expiresAt: { $gt: now } })` per authenticated request, plus the membership check for wedding routes; both hit unique indexes.
- **Invited counter:** two `countDocuments` on `{ weddingId, invited }`, both covered by one index.
- **Guest search:** prefix match on `nameLower` (`^raj`) uses the index; full-text search isn't needed at MVP sizes (under 2,000 guests per wedding).
- **Reminders on page load:** one query per wedding for events in the next 7 days and one for open to-dos due by tomorrow; results are upserted into `notifications`, where the unique index blocks duplicates.
- **Daily cron:** stale photos via `{ status: 'pending', createdAt: { $lt: now - 24h } }` and weddings via the partial `status` index.
- **Pagination:** guest list and gallery use keyset pagination (`_id` or `createdAt` cursor), 50 per page, never `skip`.

## 5. Integrity, transactions and concurrency

MongoDB has no foreign keys, so the service layer enforces every relationship; multi-document transactions are used only for the five operations where a partial write would leave bad data.

### Rules the services enforce

- **Same-wedding references:** `guests.eventIds`, `todos.eventId`, `todos.assigneeId` and `photos.eventId` must point to records of the same `weddingId`; checked on every write.
- **At least one Admin:** removing or demoting a member fails if it would leave the wedding with no Admin.
- **One creator:** exactly one membership per wedding has `isCreator: true`; only the creator can delete the wedding.
- **Caps:** 15 events, 500 photos (`photoCount`), 2,000 guests, 300 to-dos per wedding, checked before insert.
- **Slug uniqueness:** enforced by the unique index; on a duplicate-key error the service appends `-2`, `-3`… and retries.

### Transactions

### Concurrency

| Operation | Documents written together |
| --- | --- |
| Create wedding | `weddings` + creator `memberships` + `invitations` + preloaded `todos` |
| Accept team invite | Mark `teamInvites.usedAt` (conditional on unused and unexpired) + insert `memberships` |
| Delete event | `events` delete + `$pull` its id from `guests.eventIds` + unset `todos.eventId` and `photos.eventId` |
| Change slug | Push old slug to `previousSlugs` + set new `slug` |
| Reset password | Set `passwordHash` and `passwordChangedAt` + mark `passwordResets.usedAt` + delete all the user's `sessions` |

Transactions run inside a single route handler call with a Mongoose session; Atlas replica sets support them on every tier.

### Concurrency

- **Session extension:** `updateOne({ _id, lastSeenAt: { $lt: now - 1 day } }, { $set: { lastSeenAt, expiresAt } })`, so parallel requests extend a session only once.
- **Invited flag:** a direct `$set` on one guest; last write wins, which is fine for a toggle.
- **Photo cap:** `findOneAndUpdate({ _id, photoCount: { $lte: 500 - n } }, { $inc: { photoCount: n } })` reserves slots atomically before presigned R2 URLs are issued; the daily cron gives back slots from uploads that never completed.
- **Invite links:** acceptance uses a conditional update (`usedAt: null`, `revokedAt: null`, `expiresAt > now`), so a link can't be used twice even when two people click at once.
- **Publish vs edit:** publish copies `draft` to `published` in one update, so a guest never sees half an edit.

## 6. Data lifecycle

Wedding data lives as long as the wedding does; short-lived auth data expires on its own through TTL indexes.

### Retention

| Data | Kept for | Mechanism |
| --- | --- | --- |
| Weddings and everything under them | Until the creator deletes the wedding | Manual |
| Sessions | 30 days after last activity, 90 days at most | TTL on `expiresAt` |
| Password reset tokens | 30 minutes | TTL on `expiresAt` |
| Rate-limit counters | Length of the window | TTL on `expiresAt` |
| Used or expired team invites | 30 days | Daily Vercel Cron job |
| Read notifications | 90 days | TTL partial index on `readAt` (`read: true`) |
| Previous slugs | 30 days | `redirectUntil` checked on lookup; pruned on next slug change |
| Unprocessed originals in R2 and `pending` photo records | 24 hours | Daily Vercel Cron job, with an R2 lifecycle rule on `originals/` as a backup |

### Deleting a wedding (creator only)

1. Set `status: 'deleting'` and `deletingAt`; the guest site returns 404 immediately and the slug stays reserved.
2. In the same request, delete `notifications`, `todos`, `photos`, `guests`, `events`, `invitations`, `teamInvites` and `memberships`.
3. The daily cron job finds weddings in `deleting`, deletes the R2 prefixes `media/<weddingId>/` and `originals/<weddingId>/` in batches of 1,000 keys, then deletes the `weddings` document.
4. Log the deletion (wedding id, user id, time) with no personal data.

Target: database records gone immediately, R2 files and the wedding record within 24 hours. Atlas backups age out after their 7-day retention.

### Deleting a user account

- Blocked while the user is the creator of any wedding; they must delete it first (ownership transfer is v1.1).
- Otherwise: delete their `memberships`, `sessions`, `passwordResets` and `notifications`; unset `todos.assigneeId` values that point to them; then delete the `users` document.
- `invitedBy` and `uploadedBy` references stay in place and show as "Former member".

## 7. Example documents

Three representative documents show how the fields fit together; ids are shortened for reading.

### weddings

```json
{
  "_id": "6730a1…w1",
  "slug": "ajith-anu-2027-02-14",
  "previousSlugs": [],
  "brideName": "Anu",
  "groomName": "Ajith",
  "weddingDate": "2027-02-14T00:00:00Z",
  "timeZone": "Asia/Kolkata",
  "draft": {
    "story": "We met in college in Palakkad…",
    "brideFamily": "D/o Mr & Mrs Menon",
    "groomFamily": "S/o Mr & Mrs Nair",
    "couplePhotoKey": "media/6730a1…w1/couple.webp"
  },
  "published": { "story": "We met in college in Palakkad…", "brideFamily": "…" },
  "status": "published",
  "publishedAt": "2026-12-01T10:15:00Z",
  "galleryVisible": false,
  "searchIndexable": false,
  "photoCount": 0,
  "createdBy": "6730a0…u1",
  "createdAt": "2026-11-20T08:00:00Z",
  "updatedAt": "2026-12-01T10:15:00Z"
}
```

### events

```json
{
  "_id": "6730a2…e2",
  "weddingId": "6730a1…w1",
  "preset": "wedding",
  "name": "Wedding",
  "date": "2027-02-14T00:00:00Z",
  "startTime": "10:00",
  "endTime": "13:00",
  "muhurtham": "10:30 – 11:15 AM",
  "venue": {
    "name": "Sree Krishna Auditorium",
    "address": "Palakkad, Kerala",
    "mapsUrl": "https://maps.app.goo.gl/…"
  },
  "youtubeUrl": "https://youtube.com/live/abc123",
  "youtubeVideoId": "abc123",
  "order": 2
}
```

### guests

```json
{
  "_id": "6730a3…g7",
  "weddingId": "6730a1…w1",
  "name": "Rajan K",
  "nameLower": "rajan k",
  "inviteName": "Rajan Uncle & Family",
  "group": "Groom's side",
  "eventIds": ["6730a2…e2", "6730a2…e3"],
  "invited": true,
  "invitedAt": "2026-12-02T14:05:00Z",
  "invitedBy": "6730a0…u1"
}
```

The names, dates and venue above are sample values only.

## 8. Sizing, Atlas configuration, backups and migrations

A typical wedding needs about 0.3 MB in MongoDB and up to about 215 MB in Cloudflare R2 at the photo cap, so an M10 cluster holds well over 1,000 weddings. These are planning estimates, to be checked against real usage.

### Size per wedding (estimate)

| Collection | Typical count | Avg size | Total |
| --- | --- | --- | --- |
| weddings + invitations | 2 | 5 KB | 10 KB |
| events | 5 | 1 KB | 5 KB |
| guests | 500 | 0.4 KB | 200 KB |
| todos | 40 | 0.3 KB | 12 KB |
| notifications | 200 | 0.3 KB | 60 KB |
| memberships, invites, photo records | 520 | 0.1–0.3 KB | 25 KB |
| **MongoDB total** |  |  | **about 0.3 MB** |
| R2 photos at the 500 cap | 500 | 400 KB image + 30 KB thumb | about 215 MB |

### Atlas configuration

| Setting | Development and preview | Production |
| --- | --- | --- |
| Tier | Free cluster (dev), shared staging cluster (previews) | M10, 3-node replica set |
| Region | AWS ap-south-1 (Mumbai), next to Vercel functions in `bom1` | Same |
| Network access | Developer IPs + all IPs for preview deployments | All IPs (`0.0.0.0/0`), because Vercel functions have no fixed addresses; security rests on a strong app-only user over TLS. Vercel static IPs are the upgrade path |
| Database users | One read/write user per environment | Separate app user (readWrite) and migration user (dbAdmin) |
| Write concern | `majority` | `majority` |
| Read preference | `primary` | `primary` |
| Connection | Cached on a global, reused by warm function instances | Same, with `maxPoolSize: 5` per instance; watch the Atlas connection count |
| Backups | None | Daily snapshots, 7-day retention; restore tested once before launch |
| Encryption | At rest (Atlas default), TLS in transit | Same |

### Migrations

- Tool: `migrate-mongo` (suggested), with scripts in `migrations/` and an `npm run migrate` command.
- Run migrations against the target database before merging to `main`, by hand or from a protected GitHub Action. Never run them inside the Vercel build, because every preview deployment would run them too.
- Index changes ship as migrations, never as `autoIndex` at start-up.
- Additive changes first: add a field with a default, deploy code that reads both shapes, backfill, then remove the old field in a later release.
- Each schema-changing migration has a `down` step, tested on the staging cluster first.
