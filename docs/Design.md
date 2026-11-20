# Make My Marriage — Design System

Nov 19, 2026 · Source: Stitch project **"Make My Marriage Project"**, design system **"Kerala Nuptials Editorial"**

This is the visual source of truth for the UI. It takes the Stitch design system and screens and
adapts them to this codebase (Tailwind v4, CSS modules with `@apply`, shadcn/ui, next-intl).
Where Stitch disagrees with the **project rules** in `CLAUDE.md` (accessibility sizes, no Tailwind
in JSX), the project rules win. Those places are marked **Adapted**.

---

## 1. Brand & style

A modern editorial planning experience for contemporary Kerala weddings: restrained luxury,
typographic poise, precise structure.

- **Tone:** authoritative yet celebratory, warm, poised, frictionless.
- **Visual stance:** editorial minimalism, bento grid layouts, generous negative space, strong
  serif/sans contrast.
- **Audience:** contemporary couples, NRIs and families running multi-day Kerala celebrations.
- **Feeling:** high trust, composure, clarity in the middle of a lot of logistics.

**Never use:** heavy gold filigree, ornate motifs, clichéd botanical flourishes, stock bridal
photography, neon or bright yellow/gold accents. Product mockups use simple geometric
placeholders, not photos.

---

## 2. Color

The wine accent covers **under 10% of any screen**. Use it for decisions and focal points only.

### 2.1 Brand palette (what we actually use)

| Token (`globals.css`) | Hex       | Name            | Use                                                                 |
| --------------------- | --------- | --------------- | ------------------------------------------------------------------- |
| `--background`, `--card` | `#FFFFFF` | Canvas          | Default page, cards, sheets, modals                                 |
| `--muted`, `--secondary` | `#F6F5F4` | Mist            | Alternating sections, bento containers, inner panels, ghost hover   |
| `--border`, `--input` | `#E7E4E2` | Line            | Hairline borders, dividers, input strokes                           |
| `--foreground`        | `#1C1A1B` | Ink             | Headlines, icons, primary labels (never pure black)                 |
| `--muted-foreground`  | `#6B6668` | Slate           | Body copy, metadata, form labels, secondary text                    |
| `--primary`, `--ring` | `#7A1F33` | Wine            | Primary buttons, active tabs, metric numbers, focus ring, accents   |
| `--primary-hover`     | `#631828` | Wine hover      | Primary button hover                                                |
| `--accent`            | `#F5E9EC` | Wine tint       | Active chips, status pills, icon wells, count badges, selection bg  |
| `--accent-foreground` | `#7A1F33` | Wine on tint    | Text on wine tint                                                   |

Wine at 20% opacity (`border-primary/20`) is the standard border for wine-tint elements.

### 2.2 Rules

- No harsh primaries, neon, gold or bright yellow.
- Destructive actions use wine (`#7A1F33`) with neutral iconography, not bright red. (Form
  validation errors may use `--destructive`; keep it to the error text and the field border.)
- Success = ink (`#1C1A1B`) badges or subtle tonal shifts, not vivid green.
- Third-party brand marks are the one exception: the WhatsApp mark keeps `#25D366`.

### 2.3 Material palette (Stitch-generated, reference only)

Stitch also generates a Material 3 tonal palette (`primary #5c051e`, `primary-container #7a1f33`,
`surface #fef8f9`, ...). The screens don't use it; they use the brand palette above. Don't add these
tokens unless a feature needs them. The full list is in [Appendix A](#appendix-a--stitch-material-palette).

---

## 3. Typography

### 3.1 Families

| Role                  | Family       | Loaded as                          |
| --------------------- | ------------ | ---------------------------------- |
| Display & headlines   | **Fraunces** (normal + italic, `opsz` axis) | `--font-fraunces` → `font-serif` |
| Body, UI, metadata    | **Inter**    | `--font-inter` → `font-sans`       |
| Mono (URLs in mockups)| Geist Mono   | `--font-geist-mono` → `font-mono`  |

> **Note:** the Stitch design-system text names Noto Serif, but every Stitch screen uses
> **Fraunces** for headings, and so does the code. Fraunces is the decision; Noto Serif is
> not loaded.

Fonts are self-hosted by `next/font` (CSP keeps `font-src 'self'`).

### 3.2 Scale (Adapted)

Stitch sizes are in px and go down to 11px. The project rule is **body ≥ 16px, smallest 14px,
sizes in rem**. That gives this scale:

| Style              | Stitch          | **Use in code**                  | Family   | Weight | Tracking |
| ------------------ | --------------- | -------------------------------- | -------- | ------ | -------- |
| display-hero       | 56 / 64         | 3.5rem (desktop, up to ~3.875rem in hero) | Fraunces | 400    | -0.02em  |
| display-hero-mobile| 38 / 44         | 2.375rem / 2.75rem               | Fraunces | 400    | -0.01em  |
| headline-xl        | 40 / 48         | 2.5rem–2.75rem (section titles)  | Fraunces | 400    | -0.015em |
| headline-xl-mobile | 30 / 36         | 1.875rem / 2.25rem               | Fraunces | 400    | -0.01em  |
| headline-lg        | 32 / 40         | 2rem / 2.5rem                    | Fraunces | 500    | -0.01em  |
| headline-lg-mobile | 24 / 32         | 1.5rem / 2rem                    | Fraunces | 500    | —        |
| headline-md        | 22 / 28         | 1.5rem (`text-2xl`, card titles) | Fraunces | 500–600| —        |
| headline-sm        | 18 / 24         | 1.125rem (`text-lg`)             | Fraunces | 600    | —        |
| body-lg            | 17 / 26         | **1.125rem** (`text-lg`)         | Inter    | 400    | -0.005em |
| body-md            | 15 / 22         | **1rem** (`text-base`)           | Inter    | 400    | —        |
| body-sm            | 13 / 18         | **0.875rem** (`text-sm`)         | Inter    | 400    | —        |
| label-lg           | 14 / 20         | 0.875rem–1rem                    | Inter    | 600    | 0.01em   |
| label-md           | 12 / 16         | **0.875rem** (`text-sm`)         | Inter    | 600    | 0.02em   |
| label-caps         | 11 / 14         | **0.875rem** (`text-sm`), uppercase | Inter | 700    | 0.08em   |

Decorative product mockups (phone/browser previews marked `aria-hidden`) may use smaller text to
stay to scale. Real, readable content may not.

### 3.3 Rules

- Headlines above 24px are ink (`#1C1A1B`) with tight negative tracking.
- One keyword per headline may be **wine + italic** as the emotional focus
  (e.g. "Your whole wedding, one *beautiful* link.").
- Numbers (budgets, counts, times, dates) use Inter with `tabular-nums`.
- Eyebrows above section titles: `label-caps`, wine, uppercase, wide tracking.

---

## 4. Layout & spacing

### 4.1 Grid

| Breakpoint          | Columns | Gutter         | Outer margin    |
| ------------------- | ------- | -------------- | --------------- |
| Desktop ≥ 1200px    | 12      | 1.5rem (24px)  | ≥ 3rem (48px)   |
| Tablet 768–1199px   | 8       | 1.25rem (20px) | 2rem (32px)     |
| Mobile < 768px      | 4       | 1rem (16px)    | 1.25rem (20px)  |

Max content width: **1360px** (`max-w-340`) centered. Marketing sections use `max-w-7xl` with
`px-6 lg:px-12` in the Stitch screens; either is fine, be consistent per page.

### 4.2 Spacing tokens

8pt rhythm. Named Stitch steps map to Tailwind:

| Token      | Value   | Tailwind |
| ---------- | ------- | -------- |
| space-xs   | 0.25rem | `1`      |
| space-sm   | 0.5rem  | `2`      |
| space-md   | 1rem    | `4`      |
| space-lg   | 1.5rem  | `6`      |
| space-xl   | 2.5rem  | `10`     |
| gutter     | 1.5rem  | `6`      |
| margin     | 3rem    | `12`     |

Section vertical padding on marketing pages: `py-24` (`lg:py-28`/`lg:py-32` for hero-like sections).

### 4.3 Bento composition

- Content lives in independent card cells that snap to 3, 4, 6, 8 or 12 column spans.
- Card padding: `space-lg`+ on desktop (cards use ~28–32px), `space-md`+ on mobile.
- Leave extra white space around primary metrics.
- **Alternate section backgrounds** white ↔ mist (`#F6F5F4`) to separate content blocks instead of
  divider lines. Mist sections get a hairline `border-y` in `#E7E4E2`.

---

## 5. Elevation

Depth is airy: soft diffused shadows plus hairline borders.

| Tier | Use                                   | Shadow                                        | Border                         | Extra                         |
| ---- | ------------------------------------- | --------------------------------------------- | ------------------------------ | ----------------------------- |
| 0    | Flat surfaces                         | none                                          | 1px `#E7E4E2`                  | —                             |
| 1    | Bento cards, resting surfaces         | `0 20px 40px -15px rgba(28,26,27,0.06)`       | 1px `#E7E4E2`                  | —                             |
| 2    | Card hover, drawers, floating nav     | `0 28px 50px -12px rgba(28,26,27,0.09)`       | 1px `rgba(122,31,51,0.15)`     | `translateY(-2px)` (motion-safe) |
| 3    | Modals, overlays, command palette     | `0 32px 64px -16px rgba(28,26,27,0.14)`       | 1px `#E7E4E2`                  | Scrim `rgba(28,26,27,0.25)` + 12px backdrop blur |

Stitch names these `shadow-subtle`, `shadow-elevated`, `shadow-deep`. When a component first needs
one, add them to `@theme` in `globals.css` under those names rather than repeating the values.

---

## 6. Shape

| Element                     | Radius                          |
| --------------------------- | ------------------------------- |
| Cards & bento cells         | **28px desktop / 24px mobile**  |
| Large feature panels (CTA band, auth panel) | 32–36px          |
| Inner panels inside cards   | 16px (`rounded-2xl`)            |
| List rows inside cards      | 12px (`rounded-xl`)             |
| **Inputs & selects**        | **12px**                        |
| Checkbox                    | 6px                             |
| **Buttons, pills, chips, tags** | **full** (`rounded-full`)   |
| Icon wells                  | full circle, or 12–16px square in feature cards |
| Logo mark                   | 12px (header), 8px (footer)     |

---

## 7. Components

Implementation: shadcn components in `src/components/ui/` are restyled with these values through
the theme tokens or a module class passed via `className`.

### 7.1 Buttons (all pill-shaped)

| Variant   | Rest                                                         | Hover                                         | Active        |
| --------- | ------------------------------------------------------------ | --------------------------------------------- | ------------- |
| Primary   | Wine bg, white `label-lg` text, no border                    | `#631828`                                     | `scale(0.98)` |
| Secondary | White bg, 1px `#E7E4E2`, wine text (ink text in hero "See a sample site") | Wine-tint bg, border → wine (or mist bg) | —           |
| Ghost     | Transparent, slate text                                      | Ink text on mist bg                           | —             |
| Inverse   | White bg, wine text (on wine panels, e.g. final CTA)         | Off-white                                     | `scale(0.98)` |

- Sizes: header CTA `px-5 py-2.5`, hero CTA `px-7 py-3.5`, minimum touch target 44px.
- Trailing arrow icon on "go forward" CTAs.
- Visible focus ring in wine on every variant.

### 7.2 Chips & badges

- **Status pill:** wine-tint bg, wine text, `label-md`, height 28px, `px-3`, full radius,
  optional 1px `border-primary/20` and a leading 6px wine dot.
- **Neutral tag:** mist bg, 1px line border, slate text.
- **Count indicator:** circle, wine bg, white bold tabular number.
- **Role badges:** Admin = wine-tint pill; Manager = neutral tag.

### 7.3 Form inputs

- White surface, 1px `#E7E4E2`, radius 12px, height 48px, `px-4`, text `body-md` ink.
- Placeholder: slate at 60% opacity.
- **Focus:** border 1.5px wine + glow `0 0 0 3px rgba(122,31,51,0.08)`.
  **Adapted:** Stitch suppresses the outline; we keep a visible focus indicator (the wine border +
  glow counts, but it must be clearly visible in forced-colors mode too).
- Label above the field, `label-lg`, ink. Help/error text below, `text-sm`.

### 7.4 Selection controls

- **Radio:** 20px ring `#E7E4E2`; selected → wine ring with 10px wine core.
- **Checkbox:** 20px, radius 6px, 1px line border; checked → wine fill, white 1.5px check.

### 7.5 Cards & bento cells

- White bg, 1px line border, radius 28/24px, Tier 1 shadow, ~28px padding.
- On mist sections cards are white; on white sections cards may be mist (`#F6F5F4`).
- Header: eyebrow row (icon well in wine tint + `label-caps` wine text), then Fraunces title
  (`headline-md`), slate description, then the visual/mockup at the bottom.
- Optional trailing circular tool button or wine metadata pill in the header.

### 7.6 Lists & timelines (events, Muhurtham schedule)

- Row: time (tabular, `label-lg`, wine) · 1px line thread · event (`body-md`, ink) with venue in
  slate below.
- Highlighted/live event: wine-tint bg with `border-primary/20`, wine title, "Live" pill.
- Dividers: 1px `#E7E4E2`, ending 16px short of the card edge.

### 7.7 Accordion (FAQ)

- Each item is its own 16px-radius bordered card, `p-6`, question `text-base` semibold ink.
- Toggle: 28px circle on the right; open = wine-tint bg + wine "−", closed = mist bg + slate "+".
- Answer: `text-sm`/`text-base` slate, top hairline divider.

### 7.8 Icons

- Stitch screens use Material Symbols Outlined. **The code uses `lucide-react`** — pick the closest
  lucide icon; don't add the Material Symbols font.
- Icon sizes 16–22px; filled check-circle for "done"/reassurance items, in wine.
- Decorative icons are `aria-hidden`.

### 7.9 Brand logo

- Wine rounded-square mark with a white filled heart, plus "Make My Marriage" in Fraunces semibold.
- `tone="inverse"` on wine panels (white mark area, white text).

---

## 8. Page patterns

### 8.1 Site header

Sticky, white at 95% with backdrop blur, bottom hairline, height 80px. Logo left; centered nav
(Features, How it works, FAQ) in slate `text-base`, ink on hover; right side "Log in" ghost link +
primary "Create your wedding" pill. Mobile collapses nav into `mobile-nav`.

### 8.2 Landing page sections (in order)

| # | Section           | Background | Notes |
| - | ----------------- | ---------- | ----- |
| 1 | Header            | white      | see 8.1 |
| 2 | Hero              | white      | 6/6 split: eyebrow pill, headline with wine italic keyword, slate subtitle, primary + secondary CTA, 3 reassurance checks. Right: phone mockup with floating RSVP card and WhatsApp preview card, soft wine-tint blurred orb behind. |
| 3 | Trust strip       | mist       | 4 white pill items with wine icons |
| 4 | How it works      | white      | 3 mist step cards, big faded wine numbers `01–03`, icon well, footer tag line |
| 5 | Features (bento)  | mist       | 3-col bento: website (span 2), WhatsApp invites, guest list & Sadya count, to-dos, photo gallery, YouTube live (dark ink card) |
| 6 | Guest experience  | white      | phone mockup in mist frame + floating wine countdown pill; 3 icon points |
| 7 | Family roles      | mist       | 3 member cards with avatar circle, role badge |
| 8 | FAQ               | white      | 5/7 split: title + WhatsApp help chip, accordion |
| 9 | Final CTA         | white      | wine panel, radius 32px, faint white concentric rings, inverse button |
| 10| Footer            | white      | logo, copyright, links (Privacy, Terms, Contact, Report a page) in slate |

### 8.3 Auth (sign-up / login)

- **Desktop:** two columns inside a `max-w-360` shell with 16px padding/gap. Left = wine brand panel
  (rounded, faint white rings, logo, Fraunces headline, sign-up check points or login subtitle,
  decorative preview cards, trust line). Right = form column on white.
- **Mobile:** wine header band with logo + headline only; form below.
- Form: stacked inputs (§7.3), full-width primary button, link to the other auth page.

---

## 9. Motion & accessibility

- All transitions wrapped in `motion-safe:`. Typical: `transition-colors`/`transition-all`
  150–200ms; hover lift `-translate-y-0.5`; press `scale-[0.98]`; live dot `animate-pulse`.
- Text contrast: ink and slate on white/mist pass AA; white on wine passes AA. Don't put slate
  text on wine tint for long copy.
- Every interactive element has a visible focus state.
- Decorative mockups, rings, orbs and preview cards are `aria-hidden`.
- Sizes in rem; body ≥ 1rem; nothing readable below 0.875rem.

---

## 10. Stitch screen inventory

Project: **Make My Marriage Project** (`projects/15013038584962195989`)

| Screen                                  | Device  | Built in code              |
| --------------------------------------- | ------- | -------------------------- |
| Make My Marriage — Landing Page (Home Page) | Desktop | ✅ `/` (`src/components/home/*`) |
| Make My Marriage — Mobile Landing Page  | Mobile  | ✅ `/` (responsive)         |
| Make My Marriage — Desktop Sign-up      | Desktop | ✅ `/signup`                |
| Make My Marriage — Mobile Sign-up       | Mobile  | ✅ `/signup` (responsive)   |
| Make My Marriage — Desktop Login        | Desktop | ✅ `/login` (design only)   |
| Make My Marriage — Mobile Login         | Mobile  | ✅ `/login` (responsive)    |

New screens (dashboard, guest site, events, guests, to-dos, photos) should be designed in the same
Stitch project with this design system applied, then added to this table.

---

## Appendix A — Stitch Material palette

Generated by Stitch from seed `#7A1F33` (fidelity variant, light mode). Reference only.

| Token | Hex | Token | Hex |
| --- | --- | --- | --- |
| primary | `#5c051e` | on-primary | `#ffffff` |
| primary-container | `#7a1f33` | on-primary-container | `#ff8b9c` |
| primary-fixed | `#ffd9dc` | primary-fixed-dim | `#ffb2bb` |
| on-primary-fixed | `#400011` | on-primary-fixed-variant | `#812438` |
| inverse-primary | `#ffb2bb` | surface-tint | `#a03c4e` |
| secondary | `#645c5f` | on-secondary | `#ffffff` |
| secondary-container | `#e8dde0` | on-secondary-container | `#696063` |
| secondary-fixed | `#ebe0e3` | secondary-fixed-dim | `#cfc4c7` |
| tertiary | `#2e2a2c` | on-tertiary | `#ffffff` |
| tertiary-container | `#444042` | on-tertiary-container | `#b2acae` |
| tertiary-fixed | `#e8e1e3` | tertiary-fixed-dim | `#ccc5c7` |
| surface / background | `#fef8f9` | on-surface / on-background | `#1d1b1c` |
| surface-dim | `#ded9da` | surface-bright | `#fef8f9` |
| surface-container-lowest | `#ffffff` | surface-container-low | `#f8f2f3` |
| surface-container | `#f3eced` | surface-container-high | `#ede7e8` |
| surface-container-highest | `#e7e1e2` | surface-variant | `#e7e1e2` |
| on-surface-variant | `#554244` | outline | `#887173` |
| outline-variant | `#dbc0c2` | inverse-surface | `#323031` |
| inverse-on-surface | `#f5eff0` | error | `#ba1a1a` |
| error-container | `#ffdad6` | on-error-container | `#93000a` |
