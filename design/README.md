# Talabix Design System

## Overview

**Talabix** is a delivery marketplace platform operating in Saudi Arabia (primarily Riyadh). It connects customers ordering food, groceries, pharmacy items, and gifts with merchants and a fleet of riders.

The product is bilingual (English + Arabic, full RTL support) and serves four distinct actor types through four separate applications.

**Sources used:**

- Codebase: `Talabix/` (mounted local filesystem, path prefix `Talabix/`)
  - `apps/customer-app/src/ui.js` — full customer-app design token + component system
  - `apps/portal-web/src/index.css` — full portal CSS design system
  - `apps/portal-web/src/App.jsx` — portal layout, nav, session structure
  - `apps/customer-app/src/screens/` — all customer screens
  - `apps/portal-web/src/features/` — merchant + ops boards
- Design screenshots: `Talabix/design/uploads/` (WhatsApp screenshots, 9 images)
- No Figma link was provided.

---

## Products

| Product          | Tech                | Audience                                 | Path                    |
| ---------------- | ------------------- | ---------------------------------------- | ----------------------- |
| **Customer App** | Expo / React Native | End customers (mobile)                   | `apps/customer-app/`    |
| **Rider App**    | Expo / React Native | Delivery riders (mobile)                 | `apps/rider-app/`       |
| **Portal Web**   | Vite + React        | Merchants + Ops staff                    | `apps/portal-web/`      |
| **Admin UI Kit** | Static HTML + React | Store managers, ops admins, super admins | `design/ui_kits/admin/` |
| **API**          | Laravel 13          | Backend                                  | `apps/api/`             |

The Portal serves two roles: **Merchant** (orders, catalog, promotions, reports, inbox) and **Ops** (dashboard KPIs, dispatch board, configuration, promotions, settlements, support console).

---

## Content Fundamentals

### Voice & Tone

- **Functional, direct, informative** — copy tells you what is happening right now. No fluff.
- **Not playful, not corporate** — sits in a professional-but-approachable middle ground.
- **First person avoided** — uses neutral labels: "Your order", "Active orders", "Open now".
- **Sentence case for labels** — "Mark ready", "Reject order", "Start preparing" (not title case).
- **UPPERCASE only for eyebrows** — short contextual labels set in uppercase + letter-spacing: e.g. `LIVE TRACKING`, `DAILY OFFERS`, `GROSS SALES`.
- **No emoji** in either product — none appear in codebase or copy.
- **Numbers are prominent** — KPI values, delivery ETAs, cart counts, earnings are shown large and bold.
- **Arabic/RTL parity** — every string is in an i18n store; RTL layout is fully mirrored. Arabic uses zero letter-spacing for eyebrows (overridden in CSS).

### Copy Examples

- Eyebrow: "Live tracking", "Daily offers", "Active session", "Delivery control"
- Titles: "Talabix order tracking", "Your cart", "Track your delivery", "Order & fleet health"
- CTAs: "Accept order", "Mark ready", "Open now", "Checkout"
- Empty states: "No active branches", "Loading status", "Waiting for order"
- Badges: "Open now", "Closed now", "Free delivery", "H+ eligible"

---

## Visual Foundations

### Two Design Languages

Talabix has **two distinct visual systems** — one for the mobile customer experience, one for the web portal. They share brand colors loosely but have different personalities.

---

### Customer App (Mobile)

**Color vibe:** Bright, warm, high-contrast. Yellow primary dominates CTAs and active states. Green for success/location. Dark ink for text on white.

**Backgrounds:** Pure white (`#ffffff`). Warm yellow-tinted surface (`#fff9cf`) for promo banners. Soft off-white (`#f6f6f2`) for recessed panels.

**Typography:** System font (iOS/Android native). Extremely bold weights — headings and section titles use `fontWeight: 900`. Eyebrows are 12px uppercase in `--ca-green`.

**Cards:** `borderRadius: 14`, `borderTopWidth: 3` colored accent stripe, `border: 1px #ececec`, shadow `0 5px 14px rgba(0,0,0,0.05)`. No blur/frosted glass.

**Buttons:**

- **Accent (primary):** Solid `#ffe500` yellow fill, `#202124` dark ink text, `borderRadius: 14`, `minHeight: 52`
- **Secondary:** Outlined `#ececec` border, ink text; active state uses yellow fill

**Floating Tab Dock:** Rounded pill docked to bottom of screen. White background, `borderRadius: 28`, heavy shadow `0 10px 20px rgba(0,0,0,0.12)`. Active tab shows yellow icon + ink label.

**Promo banners:** Warm yellow (`#fff8bd`, border `#f2e57a`) for standard; dark (`#17191c`) for night/dark variants. `borderRadius: 18`.

**Offer cards:** Small horizontal rail cards, `borderRadius: 14`, `width: 132`, `borderWidth: 1 #ececec`.

**Product artwork:** Each category has a rich, saturated background color (deep red, maroon, forest green, navy, purple) with a photographic food illustration overlaid. Text shadow on label copy.

**Animation/interaction:** React Native's Pressable — no explicit easing defined. No custom animations in codebase (relies on native press feedback).

**Imagery:** Raster PNG product artwork with bold color backgrounds. No illustrations or gradients in UI chrome itself.

**Corner radii:** 12–14px for interactive elements, 18px for banners, 28px for dock.

---

### Portal Web

**Color vibe:** Professional, dark-navy and warm-orange. Frosted glass panels on a gradient page background. Feels like a dashboard tool.

**Backgrounds:** `linear-gradient(180deg, #f6f8fb 0%, #eef3f7 56%, #ffffff 100%)` with a subtle orange tint overlay `(135deg, rgba(255,140,66,0.08), transparent 36%)`.

**Typography:** `"Space Grotesk"` primary, `"IBM Plex Sans"` fallback. Hero h2 uses `clamp(2rem, 4vw, 3.4rem)` with `line-height: 0.95`. Eyebrows are `0.78rem` uppercase with `letter-spacing: 0.12em`, preceded by a 24px line.

**Panels/Cards:**

- `.panel`: `background: rgba(255,255,255,0.84)`, `border: 1px solid rgba(17,33,52,0.08)`, `border-radius: 18px`, `box-shadow: 0 22px 45px rgba(17,33,52,0.10)`, `backdrop-filter: blur(14px)`. Frosted glass on gradient.
- `.board-card`: `linear-gradient(180deg, rgba(255,255,255,0.96), rgba(243,247,252,0.92))`, `border-radius: 16px`, border.
- `.metric-card`: `linear-gradient(160deg, rgba(255,248,240,0.92), rgba(255,255,255,0.82))` — warm orange tint.

**Brand mark:** Square `52×52px`, `border-radius: 16px`, `linear-gradient(135deg, #112134 0%, #ff8c42 100%)` — navy to orange.

**Buttons:** `linear-gradient(135deg, #ffb347, #ff8c42)`, `box-shadow: 0 14px 30px rgba(255,140,66,0.22)`. Hover: `translateY(-1px)`, elevated shadow. Transition: `160ms ease` throughout.

**Nav active state:** `linear-gradient(90deg, rgba(255,140,66,0.12), rgba(38,166,154,0.1))` — orange-to-teal gradient strip.

**Status pills:** Capsule shape (`border-radius: 999px`), 5 semantic tones: alert (orange), success (teal), warm (amber), info (dark), muted (grey).

**Focus ring:** `3px solid rgba(255,140,66,0.74)`, `box-shadow: 0 0 0 6px rgba(255,140,66,0.18)`.

**Hover states:** `translateX(2px)` on nav links; `translateY(-1px)` on buttons. Background tints with `rgba(17,33,52,0.05)`.

**Dispatch map:** Grid-overlay background pattern (repeating horizontal + vertical lines), circular markers with white border + drop shadow, pill-shaped labels.

**RTL:** Full CSS mirror. `dir=rtl` on body swaps nav translateX direction, eyebrow letter-spacing resets to 0, gradients reverse direction.

**Animation:** All transitions `160ms ease`. `prefers-reduced-motion` respected — all transitions + animations collapse to `0.01ms`.

---

## Iconography

**Portal Web (`apps/portal-web/public/icons.svg`):**

- SVG sprite system — `<symbol>` elements referenced via `<use>`.
- Contains: social icons only (bluesky, discord, github, x, documentation-icon, social-icon).
- Stroke style: `1.35px` stroke-linecap round, fill-based for solid icons.
- Color: `#08060d` for solid social icons, `#aa3bff` for outlined icons (purple tint matching the logo).
- No icon font — inline SVG only.

**Customer App:**

- No icon library detected in codebase. Icons are represented as text characters in `ui.js` (placeholder-style: `'H'` for home/location, `'Q'` for search, `'%'` for offers).
- In production, these would be replaced with a proper icon set (Lucide or similar recommended, stroke-based, 1.5px weight).

**Logos:**

- `assets/talabix-logo.svg` — The Talabix lightning bolt logo. Color: `#863bff` (purple). Lightning-bolt / stacked zigzag shape (48×46px).
- Portal brand mark: gradient square (navy → orange) with "T" text — rendered in CSS, not a file.
- Customer app icon: `assets/customer-app-icon.png`

**Product Artwork:**
Located in `assets/product-artwork/`. Five raster PNGs for category art:

- `burger.png` — dark red bg (`#b8102f`)
- `shawarma.png` — maroon bg (`#7b1b10`)
- `market.png` — forest green bg (`#0f7f56`)
- `coffee.png` — dark blue bg (`#1d5f87`)
- `gift.png` — purple bg (`#7132a8`)

---

## File Index

```
README.md                      ← This file
colors_and_type.css            ← Full CSS custom property system
SKILL.md                       ← Agent skill manifest

assets/
  talabix-logo.svg             ← Main Talabix logo (purple lightning bolt)
  icons.svg                    ← Portal icon sprite
  customer-app-icon.png        ← Customer app launcher icon
  customer-splash-icon.png     ← Splash screen icon
  product-artwork/             ← 5 category artwork images (burger, shawarma, market, coffee, gift)

preview/                       ← Design System tab cards
  colors-customer.html
  colors-portal.html
  colors-semantic.html
  type-portal.html
  type-customer.html
  spacing-tokens.html
  components-portal-buttons.html
  components-portal-cards.html
  components-portal-status.html
  components-portal-nav.html
  components-customer-buttons.html
  components-customer-cards.html
  components-customer-dock.html
  brand-logo.html
  brand-artwork.html

ui_kits/
  customer-app/
    README.md
    index.html                 ← Customer app prototype (Home → Merchant → Cart → Tracking)
    CustomerTokens.jsx
    CustomerComponents.jsx
    CustomerScreens.jsx
  portal-web/
    README.md
    index.html                 ← Portal prototype (Ops dashboard, Dispatch, Merchant orders)
    PortalTokens.jsx
    PortalComponents.jsx
    PortalScreens.jsx

  admin/
    README.md
    index.html                 ← Store manager, admin, and super admin prototype
    components.jsx
    screens.jsx
```
