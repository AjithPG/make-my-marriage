# FEAT-XXX — <Feature name>

| Field    | Value                                         |
| -------- | --------------------------------------------- |
| Status   | Draft / Approved / In progress / Done         |
| Priority | Must / Should / Could / Won't (this release)  |
| Effort   | S / M / L                                     |
| PRD      | §5.x FR-x.x                                   |
| Depends  | FEAT-YYY (or —)                               |
| Created  | YYYY-MM-DD                                    |

## 1. Problem

Who has the problem, what it is, why it matters now. 2–4 sentences.

## 2. Scope

**In scope**

- …

**Out of scope** (and where it goes instead)

- …

## 3. User stories

- As a <role>, I want <action> so that <outcome>.

## 4. Acceptance criteria

Each criterion must be checkable against the real API or the running app (not only the UI).
Number them so Develop/QA/Review items can refer to them.

- [ ] **AC-1** Given …, when …, then …
- [ ] **AC-2** …

## 5. Technical design

Follow `CLAUDE.md`. Where this section disagrees with `docs/`, this section wins only if the
decision is recorded below.

- **API:** `METHOD /api/...` → request, response, error codes (`src/server/errors.ts`)
- **Data:** models / fields / indexes (+ migration name, with `down`)
- **Modules / server code:** files to add or change
- **UI:** pages, components (`src/components/<area>/<name>/`), `messages/en.json` keys
- **Security / limits:** auth, roles, rate limits, `weddingId` scoping
- **Env / setup (you):** new env vars, external accounts

### Decisions

| Decision | Choice | Why |
| -------- | ------ | --- |
|          |        |     |

## 6. Develop

Build order. The developer ticks each item when done.

- [ ] D1 …
- [ ] Dn `npm run typecheck` and `npm run build` pass

## 7. QA

Manual checks (`curl`, browser, Atlas) until automated tests are introduced.

- [ ] Q1 Happy path: … (AC-1)
- [ ] Q2 Edge / error cases: …
- [ ] Q3 Accessibility: keyboard only, visible focus, labels/errors linked, mobile width, 200% zoom

## 8. Review

- [ ] R1 Folder rules and dependency direction respected (`CLAUDE.md`)
- [ ] R2 Security: input validated with Zod, no secrets or guest data leaked, errors use codes
- [ ] R3 No Tailwind utilities in JSX; strings in `messages/en.json`

## 9. Learning notes

Short bullets on React / Next.js / Node.js / MongoDB concepts this feature used.
