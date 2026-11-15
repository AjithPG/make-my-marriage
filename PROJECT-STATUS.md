# Project Status — Landing Page

_Last updated: 15 Nov 2026 · Branch: `dev`_

## Goal

Build the homepage (`/`) from the Stitch designs (desktop + mobile), with copy that follows the PRD.

---

## ✅ Done

### Design analysis
- ✅ Downloaded the Stitch "Landing Page" (desktop) and "Mobile Landing Page" screens
- ✅ Listed the 10 sections: header, hero, trust strip, how it works, features, guest experience, family roles, FAQ, final CTA, footer
- ✅ Found the copy that goes beyond the first version (RSVP, sadya count, guest QR uploads, custom domain, concierge)

### Decisions
- ✅ The homepage lives in `src/app/(marketing)/page.tsx` (it already serves `/`)
- ✅ No Tailwind classes in JSX: each component gets its own `.module.css` using `@apply`
- ✅ shadcn components (`src/components/ui/`) keep their own styling
- ✅ Out-of-scope cards get first-version content (invited count, guest groups, couple-uploaded photos)
- ✅ Buttons and links point to `#` for now
- ✅ Accessible text sizes: body 16px, smallest 14px

### Setup
- ✅ Added the styling and accessibility rules to `CLAUDE.md`
- ✅ Added the shadcn Accordion (for the FAQ)
- ✅ Brand colours set in `globals.css` (wine `#7A1F33`, tint, ink, slate, mist, line)
- ✅ Fonts switched to Inter (body) and Fraunces (headings)
- ✅ All page text written in `messages/en.json` and matched to the PRD
- ✅ Fixed `next.config.ts` so `.module.css` files stay scoped (they were treated as global CSS)

### Header (`src/components/home/`)
- ✅ Brand logo
- ✅ Header with desktop nav, Log in, Create button
- ✅ Mobile menu (open/close, Escape key, focus return)
- ✅ Shown on the homepage

### Footer (`src/components/home/`)
- ✅ Small brand logo, copyright line
- ✅ Privacy, Terms, Contact, Report a page links (point to `#` for now)
- ✅ Stacks on mobile, one row on desktop
- ✅ Shown on the homepage

### Section heading (`src/components/home/section-heading/`)
- ✅ Small label + title (h2) + optional intro
- ✅ Centred or left-aligned
- ✅ Used by How it works

### Hero (`src/components/home/hero/`, `hero-preview/`)
- ✅ Label, headline with *beautiful* in wine italic, subtitle
- ✅ Create your wedding + See a sample site buttons (full width on mobile)
- ✅ 3 checkmarks: no app, one sitting, hidden from search engines
- ✅ Phone preview with Engagement, Muhurtham, Reception
- ✅ "Guests invited" card (tablet and up) and WhatsApp invite card
- ✅ Shown on the homepage

### Trust strip (`src/components/home/trust-strip/`)
- ✅ 4 badges: free, no app, hidden from search engines, made for Kerala
- ✅ 2×2 on mobile, one row of pills from tablet up
- ✅ Shown on the homepage

### How it works (`src/components/home/how-it-works/`)
- ✅ Section heading: "Live in three steps"
- ✅ 3 numbered cards: Add your events → Invite on WhatsApp → Share and celebrate
- ✅ Header "How it works" link jumps here (clears the sticky header)
- ✅ Shown on the homepage

### Features grid (`src/components/home/features/`, `feature-card/`)
- ✅ Section heading: "Everything your wedding needs, in one place"
- ✅ 6 cards: website (wide), WhatsApp invites, guest list, to-dos, photo gallery, YouTube live
- ✅ Out-of-scope content replaced (invited count + Bride's/Groom's side instead of RSVP and sadya count)
- ✅ Header "Features" link jumps here
- ✅ Shown on the homepage

### Guest experience (`src/components/home/guest-experience/`)
- ✅ "No app. No login. Just a link." heading and intro
- ✅ 3 points: every event in one view, directions in one tap, watch from anywhere
- ✅ Guest-view mockup (generic welcome, no per-guest page)
- ✅ Shown on the homepage

### Bring the family in (`src/components/home/family-roles/`)
- ✅ Heading + intro explaining Admin vs Manager (from the PRD)
- ✅ 3 cards: Meera (Admin), Arjun (Admin), Kavya (Manager)
- ✅ Shown on the homepage

### FAQ (`src/components/home/faq/`)
- ✅ 5 questions in the shadcn Accordion, first one open
- ✅ Answers follow the PRD (no RSVP, no concierge, honest privacy answer)
- ✅ Header "FAQ" link jumps here
- ✅ Shown on the homepage

### Final call to action (`src/components/home/final-cta/`)
- ✅ Wine panel with decorative rings
- ✅ "Start your wedding page today" + white "Create your wedding — it's free" button
- ✅ Shown on the homepage

### Homepage
- ✅ `(marketing)/page.tsx` shows all 8 sections plus header and footer

---

## 🔄 Doing next

### Wire up
- ⬜ `(marketing)/layout.tsx` with skip link, header and footer
- ⬜ Move `not-found.tsx` to a CSS module

### Check
- ⬜ `npm run typecheck` and `npm run build` pass
- ⬜ Compare with the Stitch desktop and mobile screens
- ⬜ Accessibility check: keyboard, focus, contrast, zoom to 200%

---

## 📝 Notes

- Every component has its own folder: `src/components/home/<name>/<name>.tsx` + `<name>.module.css`.
- To reuse a class inside the same CSS module, use `composes: className;` (`@apply` only works with Tailwind utilities).
- CSS modules start with `@reference "../../../app/globals.css";`. Using `@import` there breaks the build.
- If a CSS change doesn't show up, restart `npm run dev` (Turbopack sometimes keeps old CSS modules).
