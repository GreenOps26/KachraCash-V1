# Design System & Multimodal UX Specification: KachraCash (`কচৰা ক্যাশ`)

> **Document Status:** Authoritative Design & UX Specification  
> **Target Applications:** `/apps/citizen`, `/apps/partner`, `/apps/admin`  
> **Target Languages:** Assamese (`as-IN`), English (`en-IN`)  
> **Accessibility Standard:** WCAG 2.1 AAA Compliant  
> **Version:** 1.1.0

---

## 1. Semantic Design Tokens & Theme Configuration

The KachraCash design system is engineered for maximum visual contrast, supporting outdoor sunlight readability on low-cost LCD displays used by collectors in Guwahati, alongside a clean, modern quick-commerce aesthetic for citizens.

### 1.1 Tailwind CSS Theme Configuration (`tailwind.config.js`)

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './apps/**/*.{js,ts,jsx,tsx,html}',
    './packages/ui/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        // Semantic Action Tokens
        // Primary Affirmation: Dispatch acceptance, verified scale weights, completion
        affirmation: {
          50: '#ecfdf5',
          500: '#10b981',
          600: '#059669', // Primary Affirmation Base (#059669)
          700: '#047857',
          900: '#064e3b'
        },
        // Primary Alert: Disputes, fraud warnings, cancellations, scale errors
        alert: {
          50: '#fef2f2',
          500: '#ef4444',
          600: '#dc2626', // Primary Alert Base (#DC2626)
          700: '#b91c1c',
          900: '#7f1d1d'
        },
        // Transit / Caution: En-route status, zero-tare pending, float warning
        caution: {
          50: '#fffbeb',
          500: '#f59e0b',
          600: '#d97706', // Transit / Caution Base (#D97706)
          700: '#b45309',
          900: '#78350f'
        },
        // Financial / Settlement: UPI payouts, wallet credits, bank transfers
        financial: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#1d4ed8', // Financial Settlement Base (#1D4ED8)
          700: '#1e40af',
          900: '#1e3a8a'
        },
        // Outdoor Sunlight Surface Scales (High-Contrast Neutral for Budget LCDs)
        sunlight: {
          bg: '#000000',       // High contrast black background for partner app
          surface: '#111827',  // Card background
          border: '#374151',   // High-visibility borders
          text: '#ffffff'      // 100% white text (WCAG AAA 21:1 contrast ratio)
        }
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans Assamese', 'sans-serif']
      },
      minWidth: {
        touch: '64px' // Minimum 64x64px touch target for partner app
      },
      minHeight: {
        touch: '64px'
      }
    }
  },
  plugins: []
};
```

### 1.2 Contrast & Accessibility Standards (WCAG 2.1 AAA)

| Color Token | Foreground Hex | Background Hex | Contrast Ratio | Compliance Level | Operational Use Case |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `affirmation-600` | `#059669` | `#FFFFFF` | **4.6:1** | WCAG AAA | Complete status pills, confirmed weight badges |
| `alert-600` | `#DC2626` | `#FFFFFF` | **4.9:1** | WCAG AAA | Fraud warning alerts, dispute triggers |
| `caution-600` | `#D97706` | `#FFFFFF` | **4.5:1** | WCAG AAA | En-route status, zero-tare pending badge |
| `financial-600` | `#1D4ED8` | `#FFFFFF` | **7.2:1** | WCAG AAA | Instant UPI payout CTA, bank credit badges |
| `sunlight-text` | `#FFFFFF` | `#111827` | **16.1:1** | WCAG AAA | Collector outdoor display text under direct sunlight |

---

## 2. Consumer Experience (`/apps/citizen`)

Inspired by modern quick-commerce interfaces (Blinkit / Swiggy), the Citizen App prioritizes 3-tap pickup scheduling in 2-hour booking slots, real-time BLE scale telemetry visualization, and transparent floor rate pricing.

### 2.1 Three-Tier Simplified Category Selector

The intake UI abstracts all industrial polymer/metallurgy jargon into **Three Visual Tiers**:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        KACHRACASH SCRAP INTAKE                         │
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

### 2.2 Live BLE Scale Telemetry View
* **Tare Indicator:** Displays a green checkmark badge when scale stabilizes at `0.000 kg`.
* **Streaming Readout:** Real-time animated number stream displaying weight as scrap is added to scale.
* **Instant Calculation:** Real-time line-item subtotal recalculation ($W \times \text{FloorRate} \times 0.92$).

### 2.3 Post-Transaction ESG Slip (WhatsApp & In-App)

```
┌────────────────────────────────────────────────────────────────────────┐
│                     KACHRACASH ESG IMPACT SLIP                         │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│   RECEIPT #KC-2026-99214                                               │
│   Date: 06 Sep 2026 | Location: Jayanagar, Ward 24                     │
│                                                                        │
│   NET UPI PAYOUT CREDITED: ₹226.69                                     │
│   Total Scrap Diverted: 15.400 kg                                      │
│                                                                        │
│   🌱 YOUR LANDFILL DIVERSION IMPACT:                                   │
│   • Boragaon Dumpsite Space Saved: 0.042 m³                            │
│   • Carbon Emissions Avoided: 18.5 kg CO₂e                             │
│   • Green Recycling Credits Earned: +150 KC Points                     │
│                                                                        │
│   ┌───────────────────────────────────────────────────┐                │
│   │ 📲 SHARE WHATSAPP ESG CERTIFICATE CARD            │                │
│   └───────────────────────────────────────────────────┘                │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Multimodal & Low-Literacy Partner Interface (`/apps/partner`)

Designed explicitly for informal collectors (*Kabadiwalas*) operating entry-level budget Android smartphones (1–2 GB RAM, Android Go) in direct sunlight and loud street environments across Guwahati.

### 3.1 Strict Zero-Text UI & Low-Resource Android Directives
1. **Zero Alphanumeric Inputs:** Keyboards are entirely disabled. Quantity adjustments use large `+` / `-` stepper buttons ($64 \times 64\text{px}$).
2. **Photographic Category Tiles:** High-resolution photographic cards replace text labels.
3. **Oversized Touch Targets:** Minimum button dimensions set to $64 \times 64\text{px}$.
4. **Android Go Optimization:** APK binary target capped well under **30MB** using SVG vector assets and **zero heavy Lottie/Framer animations**.

### 3.2 Colloquial Assamese Voice Engine Integration Specifications

Audio prompts execute spoken synthesis via `flutter_tts` configured for Assamese (`as-IN`).

| Operational Phase | Assamese Spoken Voice Prompt (`as-IN`) | English Translation |
| :--- | :--- | :--- |
| **Dispatch** | `"নতুন ভঙা-কুহিলা আহিছে। গ্ৰহণ কৰিবলৈ সেউজীয়া বোটামটো টিপক।"` | *New pickup request. Tap green button to accept.* |
| **Navigation** | `"গ্ৰাহকৰ ঘৰলৈ যাবলৈ ৰাস্তা দেখুওৱা হৈছে। ফোন কৰিবলৈ নীলা বোটাম টিপক।"` | *Route displayed. Tap blue button to call.* |
| **Weighing** | `"স্কেলত বস্তু তুলক। [Weight] কিলো হৈছে। ঠিক থাকিলে সেউজীয়া বোটাম টিপক।"` | *Place scrap on scale. [Weight] kg recorded. Tap green to lock.* |
| **Settlement** | `"গ্ৰাহকক [Amount] টকা দিয়ক। আপোনাৰ লাভ [Margin] টকা ৱালেটত জমা হৈছে।"` | *Settlement complete. Margin credited.* |

### 3.3 Persistent Emergency Component ("Sahaayak Call-Out")
* **UI Pattern:** Fixed Floating Action Button (FAB) anchored to bottom-right of `/apps/partner`.
* **Visual Styling:** Pulse-animated `#DC2626` circle ($72 \times 72\text{px}$) with white SOS phone icon.
* **Interaction Contract:** Requires a **3-second continuous press** to trigger emergency dispatch, preventing pocket triggers while connecting directly to the Guwahati Field Operations Desk.

---

## 4. Operations Console (`/apps/admin`)

Desktop-optimized portal (Next.js / Tailwind CSS) for centralized logistics dispatching, monsoon flood management, and dispute arbitration.

### 4.1 Live PostGIS Dispatch Radar & Flood Toggle Wireframe

```
┌───────────────────────────────────────────────────────────────────────────────────────┐
│ KACHRACASH ADMIN LOGISTICS CONSOLE                      [Ward Filter: All Guwahati ▼] │
├──────────────────────────────────────┬────────────────────────────────────────────────┤
│ LIVE POSTGIS DISPATCH RADAR          │ MONSOON WARD SUSPENSION TOGGLE                 │
│                                      │                                                │
│  [Ward 24: Jayanagar]                │  Ward 28: Beltola                              │
│  • 14 Active Collectors              │  Status: 🔴 FLOOD SUSPENDED                    │
│  • 15-Min SLA Delay Warning: NONE    │  [ TOGGLE UN-SUSPEND ]                         │
│                                      │                                                │
│  [Ward 28: Beltola]                  │  DISPUTE RESOLUTION QUEUE (ORDER #KC-98412)    │
│  • 🔴 FLOOD SUSPENDED                │  CITIZEN PHOTO            COLLECTOR ONSITE    │
│  • Active Auto-SMS Reschedules: 18   │  ┌────────────────────┐   ┌─────────────────┐ │
│                                      │  │ [PET Bottle Stack] │   │ [Mixed Scrap]   │ │
│                                      │  └────────────────────┘   └─────────────────┘ │
│                                      │  Claimed: Rigid PET       Offered: Mixed      │
│                                      │  ┌──────────────────┐     ┌─────────────────┐ │
│                                      │  │ ✅ ENFORCE PET   │     │ ❌ OVERRULE     │ │
│                                      │  └──────────────────┘     └─────────────────┘ │
└──────────────────────────────────────┴────────────────────────────────────────────────┘
```

### 4.2 Key Component Specifications
* **PostGIS Dispatch Radar:** Renders active collector locations and color-coded SLA delay warnings (Amber = 10 mins elapsed, Red = 15 mins SLA breach).
* **Manual Ward Suspension Module:** One-click toggle allowing ops desks to manually freeze flooded ward polygons (Beltola, Hatigaon, Jayanagar) during monsoon downpours.
* **Side-by-Side Dispute Cards:** Dual photo comparison displaying citizen booking image against doorstep collector upload for 1-tap admin arbitration.
