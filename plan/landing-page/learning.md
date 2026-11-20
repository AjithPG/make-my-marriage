# Landing Page — What Was Built

The home page at `/`, plus the base setup every later feature uses (database connection, API wrapper, health check).

## Steps (in order)

1. Created the Next.js app with TypeScript, Tailwind v4 and shadcn/ui
2. Added fonts, colours and the root layout
3. Added next-intl so all text comes from `messages/en.json`
4. Built the home page sections, one component each
5. Added a 404 page
6. Added security headers in `next.config.ts`
7. Connected MongoDB Atlas and added `GET /api/health`

---

## React

- **Server components** — most sections (`Hero`, `Features`, `Faq`, …) run on the server and send plain HTML. No JavaScript reaches the browser for them.
- **Client component** — `MobileNav` has `"use client"` because it needs a click to open and close.
- **`useState`** — remembers whether the mobile menu is open.
- **`useEffect`** — listens for the Escape key while the menu is open and removes the listener when it closes.
- **`useRef`** — holds the menu button so focus can return to it after Escape.
- **`useId`** — makes a unique id that links the button to the menu (`aria-controls`).
- **Props** — `SectionHeading` and `FeatureCard` take props, so one component is reused in many sections.
- **Lists with `.map()`** — FAQ questions and feature cards render from an array, each with a `key`.
- **Accessibility** — `aria-expanded`, `aria-labelledby`, `aria-hidden` on icons and decorative mockups.

## Next.js

- **App Router** — folders in `src/app/` are the URLs.
- **Route group `(marketing)`** — the brackets group files without adding to the URL, so `(marketing)/page.tsx` is still `/`.
- **`layout.tsx`** — the root layout wraps every page (`<html>`, fonts, translations provider).
- **`not-found.tsx`** — the page shown for any unknown URL.
- **`next/font`** — downloads Google fonts at build time and serves them from our own site (faster, works with the CSP).
- **`generateMetadata()`** — sets the page title and description from the translation file.
- **next-intl** — `getTranslations()` on the server, `useTranslations()` in client components.
- **`next.config.ts`** — security headers (CSP, HSTS, no iframes) and the CSS-module rule for Tailwind.
- **`cacheComponents`** — Next 16 caching is on; pages are prerendered where possible.
- **Route handler** — `src/app/api/health/route.ts` exports `GET`; that file *is* the API endpoint.

## Node.js

- **`src/server/env.ts`** — reads `process.env` and checks it with Zod. A missing or wrong value fails with a clear message.
- **`src/server/http.ts` → `handler()`** — wraps every API route:
  - checks the `Origin` header on POST/PUT/DELETE (blocks other websites)
  - validates body, query and params with Zod
  - turns errors into `{ error: { code, message, requestId } }`
  - adds `X-Request-Id` and `Cache-Control: no-store`
- **`src/server/errors.ts`** — `AppError` class + list of error codes and their HTTP status.
- **`import 'server-only'`** — stops server files from ever being bundled into browser code.
- **`node:crypto`** — `randomUUID()` creates the request id.

## MongoDB

- **Atlas** — a hosted MongoDB cluster; database name `makemymarriage`.
- **`src/server/db.ts` → `connectDb()`** — opens one Mongoose connection and saves it on `globalThis`, so hot reloads and warm serverless calls reuse it.
- **Connection options** — small pool (5), fail fast when offline, `autoIndex: false` (indexes come from migrations only).
- **Health check** — `/api/health` sends a `ping` to the database and returns `up` or `down` with the latency.
