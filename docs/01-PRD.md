# Make My Marriage — Product Requirements Document (MVP)

Nov 2, 2026 · @Ajith

## 1. Overview

Make My Marriage is a free web product that lets a Kerala couple publish an English wedding website, invite guests over WhatsApp, and keep their wedding to-dos, guest list and photos in one place. The MVP ships 8 features for 2 logged-in roles (Admin, Manager); guests never log in.

| Field | Value |
| --- | --- |
| Product | Make My Marriage |
| Document | Product Requirements Document — MVP |
| Version | 1.1 (architecture update: Next.js on Vercel, email + password sign-in) |
| Status | Draft for review |
| Market | Kerala weddings, all communities |
| Pricing | Free in MVP |

### Problem

Kerala weddings span several events (engagement, mehendi, wedding, reception) across different venues and dates. Today couples share details through forwarded images and scattered WhatsApp messages, track invites in notebooks or spreadsheets, and lose track of who has been invited. Guests get no single, up-to-date place for dates, venues, directions and the live stream.

### Solution in one line

One shareable link per wedding — `makemymarriage.in/<bride>-<groom>-<date>` — backed by a simple planning workspace for the couple and their relatives.

## 2. Goals, non-goals and success metrics

The MVP succeeds if a couple can go from sign-up to a published, shareable wedding site in one sitting and invite their whole guest list through WhatsApp from it.

### Goals

1. Publish a mobile-friendly wedding website from one simple workspace.
2. Make inviting guests over WhatsApp fast, with a clear record of who has been invited.
3. Help the couple and relatives stay on top of wedding to-dos and upcoming events.
4. Keep guest data minimal: no guest phone numbers, emails or accounts.
5. Keep scope small enough for a solo developer to ship.

### Non-goals (MVP)

- Collecting RSVPs or attendance.
- Sending any message automatically (WhatsApp, SMS, email, push).
- Budgets, expenses, vendors.
- Monetisation.

### Success metrics

Numeric targets are set after the first 10 weddings establish a baseline.

| Metric | Definition |
| --- | --- |
| Setup completion | % of sign-ups that create a wedding with at least 1 event |
| Publish rate | % of created weddings that publish their site |
| Time to publish | Median minutes from sign-up to first publish |
| Invite coverage | % of guests marked invited, per published wedding |
| Guest reach | Unique visits to published wedding sites; share on mobile |
| To-do usage | % of weddings with at least 5 to-dos completed |
| Upload success | % of photo uploads that complete without error |
| Embed success | % of saved YouTube links that embed and play |
| Privacy incidents | Count of access-control or data-exposure issues (target: 0) |

## 3. Users, roles and permissions

The MVP has two logged-in roles per wedding — Admin and Manager — plus anonymous guests. There is no platform admin back-office in the MVP.

| Role | Who | How they get access |
| --- | --- | --- |
| Admin | Bride or groom | Signs up and creates the wedding (creator), or is invited by the creator as co-admin |
| Manager | Relatives helping with planning | Joins via an invite link sent by an Admin; link expires after 7 days |
| Guest | Anyone with the wedding link | No account; views the published site only |

A user account can belong to more than one wedding (e.g. a cousin who manages two weddings), with a separate role in each.

### Permission matrix

| Action | Admin | Manager | Guest |
| --- | --- | --- | --- |
| Create a wedding | Yes (becomes creator) | No | No |
| Edit couple details, events, venues | Yes | Yes | No |
| Manage guest list and mark invited | Yes | Yes | No |
| Use Invite (WhatsApp share) | Yes | Yes | No |
| Manage to-dos | Yes | Yes | No |
| Edit invitation design and message template | Yes | Yes | No |
| Add / update YouTube stream links | Yes | Yes | No |
| Upload, delete, hide photos | Yes | No | No |
| Publish / unpublish the website | Yes | No | No |
| Edit the site slug | Yes | No | No |
| Invite co-admin or managers; remove managers | Yes | No | No |
| Delete the wedding | Creator only | No | No |
| View the published website | Yes | Yes | Yes |

### Rules

- Every permission is enforced on the server (API route handlers and services), never only in the UI.
- A wedding always has at least one Admin; the last Admin cannot leave or be removed.
- An invite link is single-use, carries the role it grants, and can be revoked by an Admin before it expires.

## 4. User journeys

Five journeys cover the MVP; each must pass end-to-end on a mid-range Android phone in Chrome before launch.

### A. Couple creates and publishes a wedding

1. Bride or groom signs up with email and password; no verification email.
2. Creates a wedding: names and wedding date.
3. System suggests the slug `bride-groom-YYYY-MM-DD`; Admin can edit it.
4. Adds events from Kerala presets or custom, with venues and map links.
5. Picks an invitation design and edits the text.
6. Previews the site, then publishes.

### B. Admin brings in a relative as Manager

1. Admin opens Team and creates a Manager invite link.
2. Shares the link (WhatsApp or copy).
3. Relative opens it, signs up or logs in, and joins the wedding as Manager.
4. Expired or used links show a clear message and ask the Admin for a new one.

### C. Admin or Manager invites guests

1. Adds guests with name, optional invite name, group and invited events.
2. Taps Invite on a guest row.
3. WhatsApp opens with the prefilled message and site link; the guest is marked invited.
4. User picks the contact in WhatsApp and sends.
5. If they cancelled, they toggle invited off.

### D. Guest views the wedding

1. Opens the link from WhatsApp; the invitation image shows as the link preview.
2. Sees couple details, events, dates, venues.
3. Taps directions to open Google Maps.
4. Watches the YouTube live stream or browses photos when available.

### E. Couple stays on top of planning

1. Starts with a preloaded Kerala wedding checklist.
2. Edits, assigns and dates to-dos.
3. Sees due-soon to-dos and upcoming events in the notification centre.
4. Opens an item from a notification and marks it done or read.

## 5. Functional requirements

The MVP's 8 product features plus authentication are specified below in 10 areas. Each lists its requirements (FR) and acceptance criteria (AC); an AC is met only when it passes against the real API, not just the UI.

### 5.1 Authentication and accounts

- FR-1.1 Sign up and log in with email + password. No Google or other social sign-in in V1.
- FR-1.2 Passwords hashed with Argon2id; 8–128 characters; common passwords rejected.
- FR-1.3 Server-side sessions stored in MongoDB. The browser holds only a random session token in an httpOnly, Secure, SameSite=Lax cookie. Sessions slide for 30 days of activity, up to 90 days in total.
- FR-1.4 Forgot password via an emailed reset link (sent with Resend), valid for 30 minutes; a reset signs the user out everywhere.
- FR-1.5 No email verification in V1: accounts are usable immediately, including publishing.
- FR-1.6 Logged-in users can change their password and log out.

AC

- [ ] A new user can sign up, create a wedding and publish it without any email step.
- [ ] Five failed logins in 15 minutes rate-limit that account and IP.
- [ ] Logging out deletes the session on the server; the old cookie no longer works.
- [ ] After a password reset or change, every other session for that user is rejected.

### 5.2 Wedding setup and events

- FR-2.1 Create a wedding with bride name, groom name and wedding date.
- FR-2.2 Optional couple details: photo, short story, family names (e.g. son of / daughter of).
- FR-2.3 Events from Kerala presets — Engagement, Mehendi, Haldi, Wedding (Muhurtham), Reception — or a custom name.
- FR-2.4 Each event: name, date, start time, optional end time, venue name, address, Google Maps link, description, display order.
- FR-2.5 Muhurtham time shown prominently when set on the Wedding event.
- FR-2.6 Team page: invite co-admin or managers via expiring link; list and remove members.

AC

- [ ] A wedding can have 1–15 events; events sort by date, then time, unless manually reordered.
- [ ] An invalid Maps link is rejected with a clear message; a valid one opens Google Maps on the guest site.
- [ ] A Manager invite link used after 7 days, or a second time, is refused with "Ask the Admin for a new link".

### 5.3 Guest list

- FR-3.1 Guest fields: name (required), invite name (optional, e.g. "Rajan Uncle & Family"), group (e.g. Bride's side, Groom's side, Friends, custom), invited events, notes.
- FR-3.2 No phone numbers, emails or addresses are stored for guests.
- FR-3.3 Invited flag per guest: set automatically when Invite is tapped; toggled manually by Admin or Manager.
- FR-3.4 Search by name; filter by group, event and invited / not invited; counter "X / Y invited".
- FR-3.5 Bulk add by pasting one name per line; CSV import of name, invite name, group.
- FR-3.6 Delete with confirmation; bulk delete.

AC

- [ ] Guest data is never returned by any public (unauthenticated) endpoint.
- [ ] Pasting 200 names creates 200 guests in under 5 seconds.
- [ ] The invited counter updates without a page reload after Invite or a toggle.

### 5.4 WhatsApp invite flow

- FR-4.1 One message template per wedding, editable by Admin or Manager.
- FR-4.2 Placeholders: `{inviteName}`, `{bride}`, `{groom}`, `{date}`, `{link}`. `{inviteName}` falls back to the guest's name.
- FR-4.3 Tapping Invite opens `https://wa.me/?text=<encoded message>`; the user chooses the contact in WhatsApp.
- FR-4.4 The guest is marked invited at the moment Invite is tapped; a toast offers Undo for 5 seconds.
- FR-4.5 Invite is disabled until the site is published, with an explanation.

AC

- [ ] Special characters and emoji in the template survive URL encoding and show correctly in WhatsApp on Android and iOS.
- [ ] The shared link shows the invitation image, title and date as its WhatsApp preview.
- [ ] Tapping Undo reverts the invited flag in the database.

### 5.5 Invitation image

- FR-5.1 3–5 Kerala-styled designs at launch, in English.
- FR-5.2 Editable fields: headline, couple names, date, venue line, short invitation text.
- FR-5.3 One image for all guests (no per-guest personalisation).
- FR-5.4 Rendered as PNG at 1080 × 1350 (download) and 1200 × 630 (link preview); regenerated on publish and on each saved edit; stored in Cloudflare R2.
- FR-5.5 Download button; mobile Share button using the browser share sheet where available.

AC

- [ ] Long names and venue lines wrap or shrink without overflowing the design.
- [ ] Preview in the editor matches the generated PNG.
- [ ] After an edit, the link preview updates within 5 minutes (cache-busted URL).

### 5.6 Wedding website

- FR-6.1 Public URL `makemymarriage.in/<bride>-<groom>-<YYYY-MM-DD>`; on collision a short suffix is added; Admin can edit before publish.
- FR-6.2 Sections: hero (invitation), couple, events with venues and directions, live stream, gallery.
- FR-6.3 Empty sections are hidden (e.g. no gallery until photos are visible).
- FR-6.4 Draft vs published: edits save to draft; published site updates when Admin publishes again. Admin can unpublish at any time.
- FR-6.5 Unpublished or unknown slugs return a friendly "This wedding page isn't available" page (HTTP 404).
- FR-6.6 Footer: "Report this page" email link.
- FR-6.7 Sites stay live indefinitely after the wedding unless unpublished or deleted.

AC

- [ ] Guest page loads with Largest Contentful Paint under 2.5 s on a throttled 4G profile.
- [ ] Changing the slug after publishing keeps the old URL redirecting for 30 days.
- [ ] Page is not indexed by search engines (`noindex`) unless the Admin opts in.

### 5.7 Photo gallery

- FR-7.1 Admins upload photos (JPEG, PNG, HEIC, WebP) up to 20 MB each, directly to Cloudflare R2 via presigned URLs.
- FR-7.2 Server-side processing: auto-rotate, strip EXIF location data, resize to 2000 px long edge WebP plus a 400 px thumbnail.
- FR-7.3 Photos grouped by event, or "General".
- FR-7.4 Gallery visibility: hidden or visible on the public site (one switch per wedding).
- FR-7.5 Limit: 500 photos per wedding in MVP.
- FR-7.6 Delete single or multiple photos with confirmation; deletes remove the R2 objects.
- FR-7.7 Per-file upload progress, retry on failure, clear error messages.

AC

- [ ] A hidden gallery returns no photo URLs from any public endpoint.
- [ ] Original files with GPS EXIF are never served publicly.
- [ ] Uploading 50 photos on a mobile connection completes or reports per-file errors; none is silently lost.

### 5.8 YouTube live stream

- FR-8.1 Admin or Manager pastes a YouTube URL (watch, live, youtu.be or embed format) per event.
- FR-8.2 System extracts the video ID and embeds via `youtube-nocookie.com`.
- FR-8.3 "Open on YouTube" link shown with the player.
- FR-8.4 Fallback message if the video can't be embedded or has ended.
- FR-8.5 UI copy states that an unlisted stream can be watched by anyone with the link.

AC

- [ ] All four URL formats resolve to the same embed.
- [ ] A non-YouTube URL is rejected on save.

### 5.9 Wedding to-do list

- FR-9.1 To-do fields: title, due date (optional), assignee (any wedding member), linked event (optional), done.
- FR-9.2 New weddings get a preloaded, editable Kerala checklist (about 25 items, e.g. book auditorium, fix muhurtham, order invitations, book photographer, finalise sadya caterer).
- FR-9.3 Views: All, Mine, Due this week, Overdue, Done.

AC

- [ ] Deleting a preloaded item does not bring it back.
- [ ] Overdue items show in red with the number of days overdue.

### 5.10 In-app notifications

- FR-10.1 Notification centre (bell with unread count) for Admins and Managers only.
- FR-10.2 Reminder types: event in 7 days / 3 days / tomorrow; to-do due tomorrow; to-do overdue.
- FR-10.3 Activity types: event changed, photos uploaded, new member joined.
- FR-10.4 Reminders are computed when the user loads the app (no background jobs); each reminder is stored once per user per item and threshold to avoid duplicates.
- FR-10.5 Read / unread state; mark all read; tapping opens the related event or to-do.
- FR-10.6 Preference: turn each reminder type on or off.

AC

- [ ] Opening the app twice in a day never creates the same reminder twice.
- [ ] A user only sees notifications for weddings they belong to.

## 6. Language

The MVP is English only — app UI, guest website, invitation image and WhatsApp message. Malayalam moves to v1.1.

To keep v1.1 cheap, the MVP stays translation-ready:

- FR-L.1 All UI strings live in translation files (e.g. `next-intl`), with English as the only locale; no hard-coded text.
- FR-L.2 Layouts tolerate longer text (no fixed-width labels or buttons).
- FR-L.3 Invitation designs leave room for a second script later; no text baked into background artwork.

## 7. Non-functional requirements

Privacy and mobile performance are launch blockers; the rest are strong targets.

### 7.1 Privacy and security

- All authorization checks happen on the server in API route handlers and services; every query is scoped by `weddingId` and the caller's membership.
- Guests' personal data is limited to names and invite names; no contact details stored.
- Public pages and endpoints return only published content of published weddings.
- Media in Cloudflare R2: originals are private and deleted after processing; processed images use unguessable keys on the public media domain, and their URLs are returned only while the gallery is visible.
- Secrets (MongoDB URI, R2 keys, Resend API key, cron secret) live in Vercel environment variables and are read only on the server; nothing secret reaches the browser bundle.
- HTTPS everywhere; HSTS; CSRF protection (SameSite cookies + Origin check) on every mutation; Zod validation on every endpoint; rate limiting on auth and upload endpoints.
- Deletion: deleting a wedding removes its database records immediately and its R2 files within 24 hours (daily Vercel Cron job). Deleting an account removes the user's sessions and memberships; weddings they created must be deleted first.
- A privacy policy and terms page are published before launch, written with India's DPDP Act in mind.

### 7.2 Performance

| Target | Value |
| --- | --- |
| Guest site LCP, 4G mobile | < 2.5 s |
| Guest site JS (first load) | < 150 KB gzipped |
| API p95 response | < 300 ms (excluding uploads) |
| Gallery thumbnails | Lazy-loaded, WebP |

### 7.3 Accessibility

- Aim for WCAG 2.2 AA: keyboard navigation, visible focus, 4.5:1 text contrast, labelled form fields, alt text on informative images, accessible dialogs and toasts.

### 7.4 Mobile and browser support

- Mobile-first; tested on Android Chrome, iOS Safari, and desktop Chrome, Edge, Safari (latest 2 versions).
- Touch targets at least 44 × 44 px.

### 7.5 Reliability and operations

- Every screen has loading, empty, success and error states; destructive actions need confirmation.
- Daily MongoDB Atlas backups, 7-day retention.
- A Vercel preview deployment for every change, and instant rollback to the previous production deployment.
- Error tracking and uptime monitoring in place before launch (tool to be chosen).
- A daily cleanup job (Vercel Cron) for abandoned uploads and deleted weddings.
- Basic product analytics for the success metrics (privacy-friendly, no guest tracking cookies).

## 8. Technical architecture and data model

The MVP is a modular monolith: one Next.js app on Vercel serves the pages and an explicit REST API built with route handlers, with MongoDB Atlas for data, Cloudflare R2 for media and Resend for email. There is no separate backend server. Full details are in Make My Marriage — System Design (MVP) and Make My Marriage — Database Design (MVP).

### Stack

| Layer | Choice |
| --- | --- |
| App | Modular monolith: Next.js App Router, TypeScript everywhere |
| Backend | Next.js route handlers (REST API under `/api`), Node.js runtime; services + repositories per module |
| Validation | Zod, shared by forms and API |
| Auth | Custom email + password, Argon2id, server-side sessions in MongoDB with a secure cookie; no email verification in V1 |
| Database | MongoDB Atlas (Mumbai) via Mongoose |
| Media | Cloudflare R2; Sharp for resizing; `next/og` for the invitation PNG |
| Email | Resend (password reset) |
| UI | Tailwind CSS + shadcn/ui |
| Hosting | Vercel (Mumbai region), preview deployment for every pull request |
| Scheduled jobs | Vercel Cron (daily cleanup) |

### Data model (MongoDB collections)

| Collection | Key fields |
| --- | --- |
| users | email, passwordHash, name, passwordChangedAt, notificationPrefs |
| sessions | userId, tokenHash, expiresAt, absoluteExpiresAt, lastSeenAt |
| passwordResets | userId, tokenHash, expiresAt, usedAt |
| weddings | slug, brideName, groomName, weddingDate, draft, published, status (draft / published / unpublished / deleting), galleryVisible, photoCount, createdBy |
| memberships | weddingId, userId, role (admin / manager), isCreator |
| teamInvites | weddingId, role, tokenHash, expiresAt, usedAt, createdBy |
| events | weddingId, preset, name, date, startTime, endTime, venue, youtubeUrl, order |
| guests | weddingId, name, inviteName, group, eventIds\[\], invited, invitedAt, invitedBy |
| invitations | weddingId, designId, fields, messageTemplate, imageKeys, version |
| photos | weddingId, eventId?, status, originalKey, imageKey, thumbKey, width, height, uploadedBy |
| todos | weddingId, title, dueDate, assigneeId, eventId?, done, templateKey |
| notifications | userId, weddingId, type, refId, threshold, read, createdAt |

Every collection except `users`, sessions and passwordResets carries `weddingId`, indexed, and every API query filters by it.

## 9. Out of scope and future versions

These are deliberately excluded from the MVP and revisited after the first real weddings use the product.

| Item | Earliest version | Note |
| --- | --- | --- |
| Malayalam (UI, guest site, invitation, message) | v1.1 | MVP is translation-ready; needs a Malayalam font and image-rendering check |
| Email verification | v1.1 | Then required before publishing |
| Google sign-in | v1.1 | MVP is email + password only |
| RSVP and attendance tracking | v1.1 | Would require a guest-facing response flow |
| Per-guest personalised invitation image | v1.1 | MVP personalises the message only |
| Budget and expense tracking | v1.1 |  |
| Vendor management | v1.2 | Contacts, quotes, payment deadlines |
| Phone OTP login | v1.1 | Adds SMS cost |
| Platform admin back-office | v1.1 | MVP relies on a report email |
| Guest photo uploads (QR at venue) | v1.2 | Needs moderation |
| Event-level privacy | v1.2 | MVP: whole site public or unpublished |
| Automated WhatsApp / email / SMS / push | v2 | Needs provider approval, consent, cost review |
| Other Indian regions and languages | v2 |  |
| Paid plans | v2 | Free in MVP |
| Native mobile app, AI planning features | Not planned |  |

## 10. Release plan, risks and decisions

Build in six milestones; each ends with a working, deployed slice. Durations are estimates for one developer and get re-planned after M0.

### Milestones

1. **M0 — Foundations (week 1):** repo and Next.js scaffold, Vercel project with preview deploys, MongoDB Atlas, R2 bucket, Resend domain, translation-ready strings.
2. **M1 — Accounts and wedding core (weeks 2–3):** email + password auth with server-side sessions, password reset, wedding creation, events, venues, Team invites and roles, permission checks.
3. **M2 — Guest site (weeks 4–5):** public site, slug, draft/publish with cache refresh, invitation designs and PNG rendering, link preview.
4. **M3 — Guests and invites (week 6):** guest list, bulk add, CSV import, WhatsApp invite flow, invited tracking.
5. **M4 — Media and planning (weeks 7–8):** photo gallery with R2 uploads and processing, YouTube embed, to-do list with Kerala checklist, notification centre, daily cleanup cron.
6. **M5 — Hardening and beta (weeks 9–10):** accessibility pass, performance budget, security review, privacy policy, beta with 3–5 real couples. Gate: all journeys in section 4 pass on mobile.

### Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| No email verification in V1 | A mistyped email can't receive reset links; someone could sign up with another person's email | Clear email confirmation on sign-up screen; verification in v1.1 |
| Vercel function time and memory limits | Large photo batches or image rendering could time out | Direct-to-R2 uploads; process photos in batches of 10; move to a queue if needed |
| English-only limits appeal for some Kerala families | Lower adoption among Malayalam-first users | Translation-ready build; Malayalam first item in v1.1 |
| WhatsApp caches an old link preview | Guests see an outdated invitation | Versioned image keys on each regeneration |
| Storage grows because sites never expire | Rising R2 cost on a free product | 500-photo cap, WebP compression, monitor per-wedding storage |
| "Invited" marked though the message wasn't sent | Inaccurate invite list | Undo toast and manual toggle |
| Abuse or inappropriate content without a back-office | Reputational risk | Report email in footer; only Admins upload photos; manual takedown runbook |
| Solo-developer bandwidth | Slipped timeline | Strict MVP scope; cut to-dos or notifications to v1.1 first if needed |

### Open questions

- [ ] Final product domain (assumed `makemymarriage.in`).
- [ ] Exact Kerala preset event list and checklist items — validate with 3–5 couples.
- [ ] Number and style of invitation designs at launch (3 or 5).

### Decision log

| Decision | Choice |
| --- | --- |
| Market | Kerala weddings, all communities; free |
| Roles | Admin (bride/groom, creator + co-admin), Manager (relatives); no platform admin in MVP |
| Publishing, photos, team management | Admins only |
| Guest data | Name, invite name, group, events; no phone numbers |
| Invite flow | WhatsApp share with prefilled text + site link; marked invited on tap |
| Invitation | Same image for everyone; used as link preview |
| RSVP | Out of MVP |
| Event-level privacy | Out of MVP |
| Site lifetime | Stays live; Admin can unpublish or delete |
| Language | English only in MVP; Malayalam in v1.1 |
| Login | Email + password only; server-side sessions with a secure cookie; no email verification or Google sign-in in V1; managers join via 7-day invite link |
| URL | `/<bride>-<groom>-<YYYY-MM-DD>` |
| Architecture | Modular monolith: Next.js App Router with route handlers as the REST API, TypeScript everywhere, no separate Express/NestJS backend |
| Data and services | MongoDB Atlas + Mongoose, Zod, Cloudflare R2 for media, Resend for email |
| Hosting | Vercel, with Vercel Cron for scheduled jobs |
