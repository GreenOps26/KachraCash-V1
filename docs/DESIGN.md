# Design System & UX Specification: KachraCash (`কচৰা ক্যাশ`)

> **Design system:** [Glade](https://github.com/kachracash/glade) v1.0  
> **Visual reference:** [`./glade-design-system.html`](./glade-design-system.html) — open in browser for live components  
> **Target applications:** `/apps/citizen`, `/apps/partner`, `/apps/admin`  
> **Languages:** Assamese (`as-IN`), English (`en-IN`)  
> **Accessibility:** WCAG 2.1 AA minimum  
> **Version:** 3.1.0  
> **Implementation:** `src/lib/styles/glade-*.css` + `src/lib/components/*`  
> **Live previews:** `/` (hub) · `/citizen` · `/partner` · `/admin`

---

## 1. Design principles

Glade is KachraCash's grounded visual language: deep pine greens on a warm cream canvas, built for dashboards and fintech flows people check every day. Product rules from [`PRD.md`](./PRD.md) sit on top of these tokens.

| # | Principle | Implementation |
|---|-----------|----------------|
| 1 | **Show the weight, show the price** | Live BLE telemetry + tabular figures for all currency and kg values |
| 2 | **One primary action per screen** | One `btn-primary` or `btn-gold` CTA; gold reserved for the standout action |
| 3 | **Text, icon, and voice together** | Partner app pairs Glade components with Assamese TTS (`as-IN`) |
| 4 | **Zero physical cash** | Per-transaction UPI only — no wallet balance UI, no cash-agent paths |
| 5 | **Warm, trustworthy, local** | Cream surfaces + forest actions; no glassmorphism, neon gradients, or emoji UI |

### Product guardrails (non-negotiable)

- Primary citizen CTA: **"Schedule doorstep pickup"** — never AI scan or instant price estimation
- Photos: optional dispute baseline only — **no computer-vision grading**
- Partner weight input: **BLE telemetry only** — no manual numeric fields
- Payout copy: **"UPI credited"** per transaction, not stored wallet balance

### Unified product family (citizen + collector + admin)

All three surfaces share **one Glade component library**. They must look like siblings, not separate products.

| Shared element | Citizen | Partner (collector) | Admin |
|----------------|---------|---------------------|-------|
| Brand mark & wordmark | `BrandMark` in topbar | Same | Same in sidebar |
| Buttons | `btn-gold` CTA, `btn-primary` confirm | Same shapes + `btn-field` (64px) | Same |
| Cards & stat tiles | `glade-card`, `stat-card` | Same components on dark surface | Same + `greet-card` |
| Status pills | Order / ward tags | Online / job status | SLA / payout status |
| Typography | Fraunces + Inter | Identical | Identical |
| 3-step banner | `StepBanner` on home | — | — |

**Surface modes** (same tokens, different canvas):

- `data-glade-surface="light"` — citizen & admin (`cream-100` page)
- `data-glade-surface="dark"` — partner field app (`pine-950` page)

Shell components:

- `GladeShell` — mobile layouts (citizen, partner)
- `AdminShell` — desktop sidebar layout (admin)

---

## 2. Foundations

All tokens below are defined in `glade-design-system.html` `:root` and must be implemented as CSS custom properties.

### 2.1 Color palette

#### Greens & neutrals

| Token | Hex | Usage |
|-------|-----|-------|
| `pine-950` | `#0F1E16` | Partner field base, modal overlays |
| `pine-900` | `#152A20` | Admin sidebar, greeting cards, toasts |
| `pine-800` | `#1D3A2B` | Sidebar hover, elevated dark panels |
| `forest-700` | `#2C5A43` | Sidebar active state |
| `forest-600` | `#356B4E` | **Primary actions**, links, focus rings |
| `forest-500` | `#457F5F` | Success semantic, avatar default, progress fills |
| `sage-400` | `#8FAE96` | Muted labels on dark surfaces |
| `sage-300` | `#AFC7B2` | Chart inactive bars, secondary text on dark |
| `sage-200` | `#D2E0D3` | Success alert backgrounds, input focus halo |
| `cream-50` | `#FAF7EF` | Input fills, card interiors |
| `cream-100` | `#F4F0E4` | **Page background** (citizen & admin) |
| `sand-300` | `#E4DCC5` | Disabled inputs, icon button bg |
| `sand-400` | `#D6CBA8` | Borders, dividers, toggle off-state |
| `ink-900` | `#1B211C` | Primary body text |
| `ink-700` | `#3D453E` | Secondary body text |
| `ink-500` | `#6B756E` | Captions, table headers, hints |
| `ink-300` | `#9AA39B` | Placeholder, disabled text |
| `white` | `#FFFFFF` | Card surfaces, table rows |

#### Accent & semantic

| Token | Hex | Usage |
|-------|-----|-------|
| `gold-600` | `#B3822A` | Gold button hover |
| `gold-500` | `#C99A3B` | **Gold CTA**, warning semantic, highlight series |
| `gold-300` | `#E4C888` | Text selection highlight |
| `coral-600` | `#B14B41` | **Danger** — errors, disputes, destructive actions |
| `coral-100` | `#F3DAD6` | Danger alert background |
| `info-600` | `#3E6E7A` | Info semantic, UPI / banking accents |
| `info-100` | `#DCE8E9` | Info alert background |

#### Semantic mapping

| Role | Token | Notes |
|------|-------|-------|
| Success | `forest-500` | Completed pickups, UPI success |
| Warning | `gold-500` | Pending tare, low float, SLA caution |
| Danger | `coral-600` | Failed payout, dispute, SOS |
| Info | `info-600` | Navigation, help, ward suspension notices |

#### Extension token (telemetry)

| Token | Hex | Usage |
|-------|-----|-------|
| `telemetry-mono` | — | `JetBrains Mono` for scale IDs, ledger hashes, coordinates |

### 2.2 Typography

| Role | Family | Size / weight | Use for |
|------|--------|---------------|---------|
| **Display** | Fraunces | 52px / 500 | Marketing hero (rare) |
| **H1** | Fraunces | 38px / 500 | Page titles |
| **H2** | Fraunces | 27px / 500 | Section titles, stat values |
| **H3** | Inter | 20px / 600 | Card headings, list group titles |
| **Body** | Inter | 15.5px / 400, lh 1.6 | Paragraphs, descriptions |
| **Caption** | Inter | 12.5px / 600 | Form labels, stat labels |
| **Data figure** | Inter | 24px / 600, `tabular-nums` | ₹ amounts, weights, ledger columns |
| **Telemetry** | JetBrains Mono | 13px / 500 | Hardware IDs, OTP hashes |

**Font loading:**
```html
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,340..600&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

**Rules:**
- Fraunces for warmth: greetings, prices, section titles, wordmark
- Inter for everything functional; Assamese labels render in Inter
- Always `font-variant-numeric: tabular-nums` on financial and weight columns
- Max ~80 characters per line in body copy inside cards

### 2.3 Spacing scale (4px base)

| Token | Value | Typical use |
|-------|-------|-------------|
| `space-1` | 4px | Icon gaps, tight padding |
| `space-2` | 8px | Inline spacing, pill padding |
| `space-3` | 12px | Button padding-y, list row gaps |
| `space-4` | 16px | Card padding-sm, form field gaps |
| `space-5` | 24px | Card padding default |
| `space-6` | 32px | Section padding |
| `space-7` | 48px | Section breaks |
| `space-8` | 64px | Page margins |
| `space-9` | 96px | Hero spacing |

### 2.4 Radius & elevation

| Token | Value | Use |
|-------|-------|-----|
| `radius-sm` | 6px | Inputs, tags, pagination |
| `radius-md` | 12px | Alerts, topbars, inner cards |
| `radius-lg` | 20px | Primary cards, modals |
| `radius-pill` | 999px | Buttons, pills, toggles |
| `shadow-1` | `0 1px 2px rgba(15,30,22,0.06)` | Subtle lift |
| `shadow-2` | `0 6px 16px rgba(15,30,22,0.10)` | Cards, dropdowns |
| `shadow-3` | `0 16px 40px rgba(15,30,22,0.16)` | Modals, toasts |

### 2.5 Focus & selection

```css
:focus-visible {
  outline: 2px solid var(--forest-600);
  outline-offset: 2px;
}
::selection {
  background: var(--gold-300);
}
```

---

## 3. Components

Canonical markup and states live in [`glade-design-system.html`](../glade-design-system.html). Below: variant rules and KachraCash usage.

### 3.1 Buttons

| Variant | Classes | When to use |
|---------|---------|-------------|
| Primary | `btn btn-primary` | Confirm booking, accept pickup, save |
| Gold | `btn btn-gold` | **One per screen** — e.g. "Schedule pickup", "Top up float" |
| Outline | `btn btn-outline` | Secondary actions |
| Ghost | `btn btn-ghost` | Cancel, dismiss |
| Danger | `btn btn-danger` | Reject dispute, freeze wallet |
| Disabled | `[disabled]` | Float gate locked, invalid form |

Sizes: `btn-sm` (inline), default (forms), `btn-lg` (mobile primary CTAs).  
Icon buttons: `btn-icon` — 38×38px circle on `sand-300`.

**Partner minimum touch target:** 64×64px — scale `btn-lg` + padding; never icon-only without text label.

### 3.2 Form controls

- Inputs use `cream-50` fill, `sand-400` border, `forest-600` focus border + `sage-200` halo
- Error state: `is-error` on input + `field-hint is-error` in `coral-600`
- **Citizen:** category select, slot picker, optional photo upload, UPI VPA
- **Partner:** OTP keypad only for settlement — **no weight text inputs**
- **Admin:** rate card editor, ward suspend reason, dispute notes

### 3.3 Cards & stats

| Pattern | Glade component | KachraCash use |
|---------|-----------------|----------------|
| Greeting card | `greet-card` (pine-900) | Admin dashboard header |
| Stat card | `stat-card` + `stat-value` | Collector earnings, float balance, SLA % |
| List card | `list-card` + `row` | Recent pickups, ledger entries |
| Empty state | `empty-state` | No pickups, no disputes |
| Skeleton | `skeleton` | Loading rates, map, ledger |

### 3.4 Data visualization

- **Bar chart:** `sage-300` inactive, `forest-600` active — max one accent series
- **Radial gauge:** `forest-600` or `gold-500` for standout metric only
- **Sparkline:** `sage-200` fill + `forest-600` stroke
- **Progress:** `forest-600` default; `gold-500` for secondary KPI

**Admin dispatch radar:** map pins use order status pills (§3.6). SLA breach = `pill danger`.

### 3.5 Navigation

| Component | Citizen | Partner | Admin |
|-----------|---------|---------|-------|
| Topbar | Ward tag + profile | Online toggle + earnings | Search + alerts |
| Tabs | Booking / History | Jobs / Earnings | Dispatch / Ledger / Rates |
| Sidebar | — | — | Pine-900 sidebar (see HTML demo) |
| Breadcrumbs | — | — | Desk → Ward → Order |

### 3.6 Tables, badges & tags

**Status pills** (order lifecycle):

| Status | Pill class | Dot color |
|--------|------------|-----------|
| Pending | `pill warning` | gold |
| Assigned / En route | `pill info` | info-600 |
| Weighing | `pill warning` | gold |
| Completed | `pill success` | forest |
| Disputed | `pill danger` | coral |
| Reassigned | `pill neutral` | ink-500 |

**Tags:** visual tier labels (`RIGID_CONTAINERS`, `SOFT_FILMS`, `MIXED_BULKY`) as `tag` components.

**Tables:** `data-table` — hairline row dividers (`sand-300`), hover `cream-50`, right-align amount columns with tabular nums.

### 3.7 Avatars & alerts

- Avatars: `forest-500` default fill, initials, `sz-sm/md/lg`
- Online collectors: `status-dot` in `forest-600`
- Alerts inline at section top; toasts (`pine-900` bg) confirm actions (UPI sent, pickup accepted)

### 3.8 Modals & tooltips

- Modals: `cream-50` surface, `radius-lg`, `shadow-3`, overlay `rgba(15,30,22,0.45)`
- Use for: OTP confirm, ward suspend confirm, dispute resolution
- Tooltips: clarify icon-only admin controls only — partner app avoids icon-only controls

### 3.9 Iconography

- Style: single-weight line icons, `stroke-width: 2`, rounded joins
- Sizes: 16px inline, 20px default, 24px primary actions
- Set documented in Glade §Iconography: wallet, analytics, calendar, transfer, profile, search, add, settings

---

## 4. Tailwind CSS 4 implementation

Implemented in the current SvelteKit repo:

| File | Purpose |
|------|---------|
| `src/routes/layout.css` | Imports Tailwind + Glade styles |
| `src/lib/styles/glade-tokens.css` | `@theme` colors, fonts, surfaces |
| `src/lib/styles/glade-components.css` | Shared `.btn`, `.pill`, `.stat-card`, etc. |
| `src/lib/components/` | `BrandMark`, `Button`, `Pill`, `StepBanner`, `GladeShell`, `AdminShell` |

Tokens excerpt (`glade-tokens.css`):

```css
@import 'tailwindcss';

@theme {
  /* Glade colors */
  --color-pine-950: #0f1e16;
  --color-pine-900: #152a20;
  --color-pine-800: #1d3a2b;
  --color-forest-700: #2c5a43;
  --color-forest-600: #356b4e;
  --color-forest-500: #457f5f;
  --color-sage-400: #8fae96;
  --color-sage-300: #afc7b2;
  --color-sage-200: #d2e0d3;
  --color-cream-50: #faf7ef;
  --color-cream-100: #f4f0e4;
  --color-sand-300: #e4dcc5;
  --color-sand-400: #d6cba8;
  --color-gold-600: #b3822a;
  --color-gold-500: #c99a3b;
  --color-gold-300: #e4c888;
  --color-coral-600: #b14b41;
  --color-coral-100: #f3dad6;
  --color-info-600: #3e6e7a;
  --color-info-100: #dce8e9;
  --color-ink-900: #1b211c;
  --color-ink-700: #3d453e;
  --color-ink-500: #6b756e;
  --color-ink-300: #9aa39b;

  /* Typography */
  --font-display: 'Fraunces', serif;
  --font-body: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, monospace;

  /* Radius */
  --radius-sm: 6px;
  --radius-md: 12px;
  --radius-lg: 20px;
}

body {
  font-family: var(--font-body);
  background: var(--color-cream-100);
  color: var(--color-ink-900);
  -webkit-font-smoothing: antialiased;
}
```

Use Glade CSS classes directly or via shared Svelte components in `src/lib/components/`. Never fork button/card/pill styles per app — only change `data-glade-surface` and layout shell.

---

## 5. Application themes

### 5.1 Citizen app — Glade Light

- **Canvas:** `cream-100` page, `white` cards, `sand-400` borders
- **Brand:** `forest-600` primary, `gold-500` single gold CTA per screen
- **Wordmark:** Fraunces, `pine-900`

#### Home screen wireframe

```
┌────────────────────────────────────────────────────────────┐
│  KachraCash                          [Jayanagar ▾]  [👤]   │
├────────────────────────────────────────────────────────────┤
│  Schedule  →  Weigh transparently  →  Instant UPI payout   │
├────────────────────────────────────────────────────────────┤
│  SELECT SCRAP CATEGORY                                     │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │ Rigid        │ │ Soft film    │ │ Bulky &      │        │
│  │ ₹16/kg       │ │ ₹12/kg       │ │ metals ₹28/kg│        │
│  └──────────────┘ └──────────────┘ └──────────────┘        │
│  [ Floor rate guaranteed ]                                 │
│  Pickup slot: [ 10:00 – 12:00 ▾ ]                          │
│  📷 Add photo for price protection (optional)              │
│  ┌────────────────────────────────────────────────────┐    │
│  │         SCHEDULE DOORSTEP PICKUP  (btn-gold)       │    │
│  └────────────────────────────────────────────────────┘    │
└────────────────────────────────────────────────────────────┘
```

#### Weighing screen

- Scale LCD panel: `pine-900` background, weight in Fraunces `gold-300` or `sage-300`
- Tare indicator: `pill success` when `0.000 kg` + `isTared`
- Subtotal: `stat-value` with live `₹(weight × rate × 0.92)`
- OTP revealed only after weight locked

### 5.2 Admin console — Glade Light + Pine sidebar

Mirror the Glade HTML demo layout:

- **Sidebar:** `pine-900` fixed 248px, `forest-700` active link, `sage-200` link text
- **Main:** `cream-100` canvas, `white` cards
- **Financial accents:** `gold-500` on ledger highlights, `marigold` role removed — use gold

| Desk | Key components |
|------|----------------|
| Dispatch radar | Map + `pill` SLA indicators + `data-table` active jobs |
| Float ledger | `stat-card` per collector + `list-card` ledger rows |
| Rate manager | Form controls + `bar-chart` rate history |
| Ward suspension | `toggle` + `alert warning` + confirm `modal` |
| Dispute queue | Side-by-side cards + `btn-primary` / `btn-danger` |

### 5.3 Partner app — Glade Field Mode (dark)

High-contrast extension for outdoor Android Go devices. Uses Glade pine scale, not a separate palette.

| Element | Token |
|---------|-------|
| Page background | `pine-950` |
| Cards / panels | `pine-900` |
| Primary confirm | `forest-600` on `cream-50` text |
| Alert / decline | `coral-600` |
| Caution (tare, float) | `gold-500` |
| UPI / call actions | `info-600` |
| Scale readout | Fraunces 32px, `sage-300`, `telemetry-mono` for kg |

**Field rules:**
- Minimum touch target: **64×64px**; text label beside every icon
- Online toggle: `toggle` component; **disabled** when `floatBalance < ₹2,000`
- Disabled copy (Assamese): *"কম ফ্ল’ট: নূন্যতম ₹২,০০০ প্ৰয়োজন"*
- No alphanumeric keyboard for weight; OTP uses numeric keypad only

#### Assamese TTS cues (`as-IN`)

| Event | Spoken prompt |
|-------|---------------|
| New dispatch | "নতুন ভঙা-কুহিলা আহিছে। গ্ৰহণ কৰিবলৈ সেউজীয়া বোটামটো টিপক।" |
| Navigation | "গ্ৰাহকৰ ঘৰলৈ যাবলৈ ৰাস্তা দেখুওৱা হৈছে। ফোন কৰিবলৈ নীলা বোটাম টিপক।" |
| Weighing | "স্কেলত বস্তু তুলক। [Weight] কিলো হৈছে। ঠিক থাকিলে সেউজীয়া বোটাম টিপক।" |
| Settlement | "গ্ৰাহকক [Amount] টকা UPI-ত প্ৰেৰণ কৰা হ’ল।" |

---

## 6. Responsive behavior

| Breakpoint | Behavior |
|------------|----------|
| `< 900px` | Hide admin sidebar; stack `cols-2/3/4` grids to single column |
| Mobile citizen | Full-width `btn-gold btn-lg`; category cards stack vertically |
| Partner Android | Design at **360×800** primary; test 360×780, 412×915 |

Reference frames from Glade: 375×667, 390×844, 360×800, 412×915.

---

## 7. Accessibility

- **Contrast:** All text meets WCAG AA on assigned backgrounds (forest on cream, sage on pine)
- **Focus:** Visible `forest-600` focus ring on all interactive elements
- **Motion:** Respect `prefers-reduced-motion: reduce` — disable shimmer/slide transitions
- **Partner multimodal:** Every critical action has TTS + icon + text label
- **Numbers:** `tabular-nums` on all ₹ and kg displays

---

## 8. Motion

| Interaction | Duration | Easing |
|-------------|----------|--------|
| Button press | 120ms | `scale(0.97)` |
| Toggle slide | 150ms | ease |
| Toast enter | 300ms | translateX |
| Modal open | 200ms | scale + opacity |
| Skeleton shimmer | 1.6s | infinite (disable with reduced-motion) |

No animation-heavy transitions on partner app (1–2 GB RAM devices).

---

## 9. Brand assets

| Asset | Spec |
|-------|------|
| Wordmark | Fraunces 600, `pine-900` on light / `cream-50` on dark |
| Brand mark | 34×34px, `radius-md`, gradient `sage-300` → `forest-600`, leaf icon |
| App icon | Same gradient mark on `cream-50` or `pine-900` |

---

## 10. Document cross-references

| Need | Document |
|------|----------|
| Product rules & guardrails | [`PRD.md`](./PRD.md) |
| Feature acceptance criteria | [`PRD.md`](./PRD.md) §7 |
| BLE / scale UI behavior | [`ARCHITECTURE.md`](./ARCHITECTURE.md) §5 |
| Component test coverage | [`TDD.md`](./TDD.md) |
| Live component gallery | [`./glade-design-system.html`](./glade-design-system.html) |
