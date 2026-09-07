# Design System & Multimodal UX Specification: KachraCash (`কচৰা ক্যাশ`)

> **Document Status:** Authoritative Design & UX Specification  
> **Target Applications:** `/apps/citizen`, `/apps/partner`, `/apps/admin`  
> **Target Languages:** Assamese (`as-IN`), English (`en-IN`)  
> **Accessibility Standard:** WCAG 2.1 AAA Compliant  
> **Design System Name:** Banyan & Marigold  
> **Version:** 2.0.0

---

## 1. Core Product Design Principles

1. **Show the Weight, Show the Price:** Every transaction state explicitly presents certified weight telemetry alongside real-time calculated earnings. No hidden deductions or unverified figures.
2. **One Primary Action Per Screen:** Focus user attention on a single high-contrast primary touch target per view, eliminating decision fatigue for both residents and collectors.
3. **Text, Icon, and Voice Together:** Multimodal experience pairing visual typography, clear iconography, and spoken Assamese audio prompts for maximum accessibility across digital literacy levels.
4. **Zero Physical Cash Handling:** 100% digital settlement via programmatic UPI rails triggered by customer OTP verification. No doorstep cash handoffs or physical cash float ledgers.

---

## 2. Design Tokens & Dual-Palette System

The "Banyan & Marigold" design system uses a dual-palette model optimized for application contexts: Light Paper mode for consumer and admin surfaces, and High-Contrast Outdoor Dark mode for collector field devices.

### 2.1 Dual-Palette Color Tokens

#### Palette A: Citizen & Admin (Light Paper Theme)
* **Paper Base:** `#F1F5EF` — Soft, organic background tint
* **Surface Card:** `#FBFCFA` — High-elevation clean card surface
* **Banyan Green:** `#1F4D3C` — Primary brand affirmation & action anchor
* **Banyan Soft:** `#DEEAE3` — Subtle background fills & badge highlights
* **Marigold:** `#C97A2B` — Warm secondary accent & financial highlight
* **Marigold Soft:** `#F4E3CD` — Secondary container background
* **Ink Deep:** `#1F2A24` — High-contrast primary typography & icons
* **Rust Red:** `#9C3B2A` — Primary alert & destructive action token
* **Border Neutral:** `#DCE3D8` — Crisp card boundaries

#### Palette B: Partner Sahaayak (Outdoor High-Contrast Dark Theme)
* **Forest Base:** `#07110E` — Deep dark background reducing sunlight glare & battery consumption
* **Forest Panel:** `#0C1915` — Secondary panel elevation
* **Forest Card:** `#10221C` — High-visibility component card surface
* **Semantic Green (Confirm):** `#059669` — Primary dispatch acceptance & confirmed weighment
* **Crimson Red (Alert):** `#DC2626` — Dispute, hazard warning, and decline actions
* **Amber Yellow (Caution):** `#D97706` — En-route, zero-tare pending, and low-float alert
* **Royal Blue (Financial):** `#1D4ED8` — Doorstep UPI disbursal & banking actions
* **Telemetry Cyan:** `#55F3CF` — High-visibility digital scale readout
* **Brand Lime:** `#C7FF3D` — High-visibility telemetry highlights

---

## 3. Typography Hierarchy

1. **Display & Numbers — Fraunces:** Used for currency values, scrap weights, order totals, and editorial header titles.
2. **UI Copy & Body — IBM Plex Sans:** Primary UI typeface providing full support for Assamese (`as-IN`) and English text rendering.
3. **Telemetry & Ledger Hashes — JetBrains Mono / SF Mono:** Monospaced font for scale hardware IDs, cryptographic hashes, transaction keys, and PostGIS coordinates.

---

## 4. Consumer Experience (`/apps/citizen`)

Inspired by modern quick-commerce interfaces (Blinkit / Swiggy / Byewaste), the Citizen App prioritizes Byewaste's 3-step value promise: **"Schedule → Weigh Transparently → Instant UPI Payout"**.

### 4.1 Persistent 3-Step Value Banner & 3-Tier Visual Selector

```
┌────────────────────────────────────────────────────────────────────────┐
│                        KACHRACASH SCRAP INTAKE                         │
├────────────────────────────────────────────────────────────────────────┤
│  [ 📅 Schedule  ──>  ⚖️ Weigh Transparently  ──>  💳 Instant Payout ]  │
├────────────────────────────────────────────────────────────────────────┤
│  [Ward Tag: Jayanagar 📍]                      [Floor Rate Guaranteed] │
│                                                                        │
│  SELECT SCRAP CATEGORY:                                                │
│                                                                        │
│  ┌────────────────────────┐  ┌────────────────────────┐                │
│  │ 🍾 RIGID CONTAINERS    │  │ 📦 SOFT FILM & PAPER   │                │
│  │ PET Bottles, HDPE, Cans│  │ Cardboard, Newspaper   │                │
│  │  ₹16.00 / kg           │  │  ₹12.00 / kg           │                │
│  └────────────────────────┘  └────────────────────────┘                │
│                                                                        │
│  ┌───────────────────────────────────────────────────┐                 │
│  │ ⚙️ BULKY & METALS                                 │                 │
│  │ Appliances, Iron, Steel, Copper, Brass            │                 │
│  │  ₹28.00 / kg (Floor Baseline)                     │                 │
│  └───────────────────────────────────────────────────┘                 │
│                                                                        │
│  [SELECT 2-HOUR PICKUP SLOT: 10:00 AM - 12:00 PM  ▼]                   │
│                                                                        │
│  ┌───────────────────────────────────────────────────┐                 │
│  │ 🚀 SCHEDULE DOORSTEP PICKUP                       │                 │
│  └───────────────────────────────────────────────────┘                 │
└────────────────────────────────────────────────────────────────────────┘
```

* **Photo Upload for Price Protection:** Photo attachments are clearly labeled as *"Add scrap photo for price protection (optional)"*. Photo uploads function strictly as a dispute baseline, NOT an automated computer-vision pricing scanner.

### 4.2 Live BLE Scale Telemetry View
* **Scale LCD Mirror:** Dark embedded LCD mirror (`#172E24`) displaying zero-tare baseline check in Banyan Green (`#1F4D3C`) and streaming live weight in Brand Lime (`#C7FF3D`).
* **Instant Subtotal Calculation:** Real-time line-item subtotal recalculation ($W \times \text{FloorRate} \times 0.92$).

---

## 5. Multimodal Partner Sahaayak Interface (`/apps/partner`)

Designed explicitly for informal collectors (*Kabadiwalas*) operating entry-level budget Android smartphones (1–2 GB RAM, Android Go) in direct sunlight across Guwahati.

### 5.1 Strict Zero-Text UI & Float-Gated Toggle
* **Zero Keyboards:** Alphanumeric keyboards are hard-disabled. All interactive inputs use large $64 \times 64\text{px}$ touch targets.
* **Float-Gated Status:** The "Online/Offline" toggle switch requires `floatBalance >= ₹2,000`. If float balance falls below ₹2,000, the toggle locks in the disabled state showing an Assamese warning: *"কম ফ্ল’ট: নূন্যতম ₹২,০০০ প্ৰয়োজন"* (*"Low Float: Min ₹2,000 required to take pickups"*).

### 5.2 Assamese Spoken Audio Cues (`as-IN`)
* **Dispatch:** `"নতুন ভঙা-কুহিলা আহিছে। গ্ৰহণ কৰিবলৈ সেউজীয়া বোটামটো টিপক।"` (*New pickup request. Tap green button to accept.*)
* **Navigation:** `"গ্ৰাহকৰ ঘৰলৈ যাবলৈ ৰাস্তা দেখুওৱা হৈছে। ফোন কৰিবলৈ নীলা বোটাম টিপক।"` (*Route displayed. Tap blue button to call.*)
* **Weighing:** `"স্কেলত বস্তু তুলক। [Weight] কিলো হৈছে। ঠিক থাকিলে সেউজীয়া বোটাম টিপক।"` (*Place scrap on scale. [Weight] kg recorded. Tap green to lock.*)
* **Settlement:** `"গ্ৰাহকক [Amount] টকা দিয়ক। আপোনাৰ লাভ [Margin] টকা ৱালেটত জমা হৈছে।"` (*Settlement complete. Margin credited.*)

---

## 6. Admin Operations Console (`/apps/admin`)

Desktop-optimized portal using `#07110E` base theme and `#0C1915` sidebar:
* **PostGIS Dispatch Radar:** Live map rendering active collectors, pickup nodes, and color-coded 15-minute SLA breach warnings.
* **Wallet Ledger Desk:** Displays collector float balances with Marigold accents (`#C97A2B`). Redacts sensitive identifiers (e.g. `[Aadhaar Redacted]` with hashes like `KACHRA-KYC-e3b0c442`).
* **Monsoon Ward Suspension:** One-click toggle module freezing flooded ward polygons (Beltola, Hatigaon, Jayanagar) and dispatching customer SMS rescheduling notices.
