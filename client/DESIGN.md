# UNIUYO Engineering Library — Design System

Light-first, warm, editorial system for the Faculty Library client. The palette is
anchored on a warm paper canvas, a single brand accent used sparingly for calls to
action, and pastel accents that only ever appear as soft background washes.

---

## 1. Color

### 1.1 Brand (primary only)

| Token | Value | Usage |
| --- | --- | --- |
| `--primary` | `#ff6302` (oklch 69.21% 0.2064 42.47) | The one and only accent: filled primary buttons, focus rings, selection. Never decorative. |
| `--primary-bright` | `#ff7329` | Hover toward light for the primary action. |
| `--primary-deep` | `#e55300` | Pressed / active tint of the primary action. |
| `--primary-foreground` | `#3e2118` | Text and icons sitting on the primary color. Warm near-black, not pure white. |

### 1.2 Base tokens

| Token | Hex | Role |
| --- | --- | --- |
| `--background` | `#f8f7f4` | App / page background. Used for `background`, large flat sections. |
| `--card` | `#fffefa` | Elevated surface. Cards, modals, dropdowns, sheets. |
| `--muted` / `--secondary` / `--accent` | `#eaece2` | Soft neutral wash. Secondary buttons, muted chips, code blocks, table headers, skeleton shimmer. |
| `--foreground` | `#292a26` | Primary text, headings. |
| `--muted-foreground` | `#56584f` | Secondary text, captions, placeholders, muted foreground. |
| `--border` / `--input` | `#e5e4df` | Borders, dividers, input outlines. 1px, never heavier. |

Error / destructive is derived from the brand family: `#c8331a` (deep warm
error) with `#fff` foreground, keeping the system warm rather than clinical red.

### 1.3 Pastel accents — background washes only

Pastels are never text or fill colors. They exist solely as flat tinted card
backgrounds so content areas read as "chunks" of the same paper world.

| Token | Hex | Suggested use |
| --- | --- | --- |
| `--accent-lavender` | `#eeecf7` | Events, culture |
| `--accent-mint` | `#e5f2e8` | Verified / success states |
| `--accent-blush` | `#f9ecec` | Alerts, soft destructive tint |
| `--accent-sand` | `#f5edde` | Materials, documents |
| `--accent-sky` | `#e6f0f6` | Information, system notices |

Rule: a pastel accent may only occupy a panel background behind neutral ink
text. It never carries contrast by itself (`--accent-foreground` is always
`ink`).

---

## 2. Type

| Token | Family | Weight axis |
| --- | --- | --- |
| Display / body | `DM Sans Variable` (self-hosted) | variable 100–1000 |
| Code / labels | `DM Mono` (self-hosted, 400 / 500) | fixed |

Hierarchy:

| Level | Size / Weight | Sample |
| --- | --- | --- |
| Display | 5rem / 700 tight | Page heroes, "big ideas" |
| H1 | 3.125rem / 700 | Page titles |
| H2 | 2.5rem / 650 | Section headers |
| H3 | 1.75rem / 600 | Card group headers |
| H4 | 1.25rem / 600 | Card titles |
| Body | 1rem / 420 at 1.6 line-height | Default text |
| Small | 0.875rem / 420 | Meta lines, captions |
| Mono label | 0.6875rem / 500, 0.09em tracking, uppercase | Eyebrows, badges, tab labels, table headers |

Rules:

- Body width stays between 65–75ch. No line exceeds ~46ch in paragraphs.
- Tracked uppercase mono is the system's "label voice" — eyebrows, table
  headers, button text where appropriate.
- Never use an em dash or invented words in UI copy.

---

## 3. Radius

| Token | Value | Applied to |
| --- | --- | --- |
| `--radius-sm` | 8px | Buttons, inputs, chips, table rows, small cards |
| `--radius-md` | 13px | Standard cards, dropdowns, popovers |
| `--radius-lg` | 22px | Dialogs, sheets, large surfaces |
| `--radius-xl` | 36px | Hero pills, feature callouts, big search bars |

Everything is rounded; nothing is a perfect circle except avatars and icons
that are circular by nature.

---

## 4. Shadow

| Token | Value | Applied to |
| --- | --- | --- |
| `--shadow-card` | `0 1px 2px rgba(41,42,38,0.05), 0 4px 12px rgba(41,42,38,0.06)` | Resting cards on canvas |
| `--shadow-soft-lift` | `0 2px 6px rgba(41,42,38,0.06), 0 12px 28px rgba(41,42,38,0.10)` | Hover, dropdowns, popovers |
| `--shadow-modal` | `0 8px 24px rgba(41,42,38,0.10), 0 32px 64px rgba(41,42,38,0.16)` | Dialogs, sheets |

No colored glows, no neon. Shadows are warm-tinted, layered, and quiet.

---

## 5. Spacing

4px base grid, in strict steps:

`4 8 12 16 20 24 32 40 48 56 64 80 96 128`

- Section padding on pages: `96px` vertical (mobile `64px`).
- Card padding: `24px` (mobile `20px`).
- Stack gaps inside cards: `12px`–`16px`.
- Negative space is a feature: dense surfaces are reserved for tables and
  dashboards only.

---

## 6. Components & behavior

Buttons
- Primary: only the brand color is allowed for the single primary CTA of a
  screen. Background `primary`, foreground `on-primary`, radius-sm, 48px touch
  height, hover `primary-bright`, active `primary-deep`.
- Secondary: soft neutral wash fill, ink text, hairline border. Tertiary:
  ghost, `muted-foreground` text that deepens on hover.
- Icon buttons: 40px, radius-sm, ghost on canvas, soft wash on paper.

Cards
- Elevated surface background, hairline border (1px), radius-md, `shadow-card`.
- Hover raises to `shadow-soft-lift` without moving layout.
- Emphasis cards may drop the border and use a pastel accent wash + radius-lg.

Forms
- Inputs: elevated surface fill on canvas, hairline border, radius-sm, 48px
  height, mono fast labels (0.6875rem uppercase).
- Focus: 2px ring in `primary` at 25% alpha, border turns `primary`.
- Errors: `#c8331a` text + soft blush wash on the field.

Tables
- Header row: mono uppercase 0.6875rem on soft wash; rows on elevated surface;
  hairline row dividers; hover row wash at 60%.

Modals / sheets
- Elevated surface fill, radius-lg (22px), `shadow-modal`, full-screen sheets
  on mobile.

Navigation
- Nav links are tertiary ghost pills; the active page gets a soft wash pill
  (never the brand color). The brand color appears only on the sign-in /
  primary CTA.

---

## 7. Motion

- Durations: hover 150ms, dropdowns/popovers 200ms, modals 260ms.
- Single easing: `cubic-bezier(0.2, 0, 0, 1)` — exposed as `--ease-nuesa`.
- Only opacity + transform + shadow animate. No layout animation.
- Reduced motion: respect `prefers-reduced-motion` and collapse all motion.

---

## 8. Implementation mapping

The tokens above map to the Tailwind v4 theme in `src/index.css`:

- `background` → `--background`
- `card` / `popover` → `--card`
- `muted` / `secondary` / `accent` → `--muted`
- `foreground` → `--foreground`
- `muted-foreground` → `--muted-foreground`
- `border` / `input` → `--border`
- `primary` → `--primary`
- `primary-foreground` → `--primary-foreground`
- `destructive` → `#c8331a`
- radius: `sm` 8px · `md` 13px · `lg` 22px · `xl` 36px
- shadows: `shadow-card`, `shadow-soft-lift`, `shadow-modal`
- pastels: `bg-accent-lavender`, `bg-accent-mint`, `bg-accent-blush`,
  `bg-accent-sand`, `bg-accent-sky` (wash usage only)
- easing: `ease-nuesa`
- fonts: `--font-sans` = DM Sans Variable, `--font-mono` = DM Mono
- dark mode: re-derived from the warm ink palette (below).

### Dark mode

Dark mode is derived, not an inversion. Warm ink becomes the canvas:

| Token | Value |
| --- | --- |
| `background` | `#1d1e1b` |
| `card` / `popover` | `#262722` |
| soft wash (muted/secondary/accent) | `#2e2f2a` |
| `foreground` | `#f4f3ee` |
| `muted-foreground` | `#a3a69a` |
| hairline | `#3a3b34` |
| `primary` | unchanged `#ff6302`, `on-primary` `#3e2118` |
| `destructive` | `#ff6b4a` (readable on dark) |