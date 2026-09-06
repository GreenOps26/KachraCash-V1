# KachraCash (`কচৰা ক্যাশ`)

> **Asset-Light Waste-Tech & Circular Economy Marketplace for Guwahati, Assam, Northeast India**

[![TypeScript](https://img.shields.io/badge/TypeScript-Strict_Mode-blue.svg)](https://www.typescriptlang.org/)
[![Monorepo](https://img.shields.io/badge/Monorepo-pnpm_Workspaces-orange.svg)](https://pnpm.io/)
[![Build System](https://img.shields.io/badge/Turborepo-2.10-red.svg)](https://turbo.build/)
[![Database](https://img.shields.io/badge/Neon_PostgreSQL-PostGIS-brightgreen.svg)](https://neon.tech/)
[![Compliance](https://img.shields.io/badge/Statutory_SWM-Rules_2026_Compliant-green.svg)](https://cpcb.nic.in/)
[![License](https://img.shields.io/badge/License-Proprietary-darkgrey.svg)]()

---

## 1. Executive Overview & Problem Validation

**KachraCash** is an asset-light, two-sided scrap-tech marketplace engineered specifically for the hyper-local operating environment of **Guwahati, Assam**. 

Guwahati suffers from severe municipal collection bottlenecks across key residential and commercial wards—including **Beltola, Jayanagar, Ganeshguri, Wireless/Hatigaon, and Noonmati**. Informal recycling chains suffer from widespread scale manipulation on hanging spring scales (20–30% weight distortion), price haggling, and a total absence of digital payment records.

```
       INFORMAL SCRAP CHAIN (TRADITIONAL)
       [Citizen] ──(Analog Scale/Haggle)──> [Itinerant Collector] ──> [Wholesale Dealer] ──> [Recycler]
       
       KACHRACASH ASSET-LIGHT PLATFORM
       [Citizen] <──(BLE Telemetry/UPI)──> [Gig Collector (Pre-funded Wallet)] <──(Rate Card API)──> [KachraCash Platform]
```

### Strategic Positioning: Asset-Heavy vs. Asset-Light Model

| Dimension | Asset-Heavy Direct Fleet Model (e.g. ScrapUncle) | KachraCash Asset-Light Marketplace Model |
| :--- | :--- | :--- |
| **Asset Ownership** | High CAPEX: Company-owned electric trucks, central sorting hubs, permanent warehouse leases. | Zero CAPEX: Independent gig collectors (*Kabadiwalas*) utilize existing three-wheelers/rickshaws with standardized BLE scales. |
| **Scalability** | Linear scaling limited by vehicle fleet acquisition and warehouse capacity. | Exponential hyper-local scaling driven by pre-funded collector wallets and PostGIS zone dispatching. |
| **Cost Structure** | High fixed payroll for drivers, warehouse staff, and fleet maintenance. | Variable operational costs; platform monetizes via an automated **8% take-rate** per executed transaction. |
| **Guwahati Adaptation** | Heavy trucks struggle in narrow bypass lanes of Hatigaon, Jayanagar, and hilly terrain. | Local gig collectors seamlessly navigate narrow residential lanes (*golis*) and high-density markets. |

---

## 2. Monorepo Architecture & Applications

The repository is structured as a high-performance monorepo managed via **pnpm Workspaces** and **Turborepo**:

```
kachracash/
├── apps/
│   ├── citizen/             # Consumer Mobile App (React Native / Expo: iOS & Android)
│   ├── partner/             # Collector APK (Android-ONLY, low-resource optimized for 1-2 GB RAM Android Go)
│   └── admin/               # Operations & Logistics Portal (Desktop-ONLY Next.js 15 App Router)
├── packages/
│   ├── db/                  # Prisma ORM 14-table schema targeting Neon Serverless Postgres + PostGIS
│   ├── api/                 # Shared Fastify & tRPC routers, controllers & dispatch services
│   └── types/               # Shared Zod DTO schemas, TypeScript types & BLE payload contracts
├── docs/                    # System blueprints (AGENTS.md, PRD.md, ARCHITECTURE.md, TDD.md, DESIGN.md)
├── .cursorrules             # System coding rules for IDE & autonomous agents
└── package.json             # Root monorepo workspace configuration
```

### Architectural Import Boundaries

```
┌─────────────────────────────────────────────────────────────┐
│                       CLIENT LAYER                          │
│   /apps/citizen        /apps/partner        /apps/admin     │
└──────────────┬───────────────┬──────────────────────┬───────┘
               │               │                      │
               ▼               ▼                      ▼
┌─────────────────────────────────────────────────────────────┐
│                       CONTRACT LAYER                        │
│             /packages/api       /packages/types             │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                       DATABASE LAYER                        │
│                       /packages/db                          │
└──────────────────────────────┴──────────────────────────────┘
```

---

## 3. Core System Architecture & Operational Safeguards

### 3.1 Hardware BLE Scale Ingestion & Anti-Fraud Protocol
* **Day-1 Dependency:** Weight data streams directly from authenticated Bluetooth Low Energy (BLE) hanging scales (`GATT UUID: 0000ffe0-0000-1000-8000-00805f9b34fb`).
* **Zero Manual Inputs:** Editable `<input type="number">` fields for scrap weight are **strictly forbidden** in `/apps/partner`.
* **Zero-Tare Verification:** The app forces a mandatory visual zero-tare confirmation (`0.000 kg`) with hardware HMAC signature verification before scrap weight can lock.

### 3.2 Phase 1 Floor Rate Card Pricing
Scrap commodity prices are calculated deterministically using the Phase 1 Floor Rate Card algorithm:

$$P_{\text{floor}} = \left[ P_{\text{national}} - (C_{\text{freight}} + C_{\text{handling}} + M_{\text{aggregator}}) \right] \times (1 - M_{\text{collector}}) \times (1 - \alpha_{\text{risk}})$$

* **Short-haul Freight Offset ($C_{\text{freight}} = \text{₹1.20/kg}$):** Byrnihat induction rolling mills (Ferrous scrap).
* **Long-haul Freight Offset ($C_{\text{freight}} = \text{₹3.50/kg}$):** West Bengal mills via Siliguri corridor (Polymers & paper).

### 3.3 Financial Settlement & Pre-Funded Escrow Wallets
* **Wallet Threshold:** Collectors MUST maintain a pre-funded minimum float balance of **₹2,000** in their platform wallet.
* **Instant UPI Payouts:** 100% of customer payouts execute programmatically via Cashfree/RazorpayX UPI rails triggered by doorstep customer 4-digit OTP verification.
* **8% Take-Rate Split:** Upon customer OTP confirmation, the platform automatically disburses **92%** to the citizen's bank account while debiting **100%** of the gross value from the collector's float.

### 3.4 Multimodal Assamese Voice UI (`as-IN`)
To support low-literacy collectors, `/apps/partner` incorporates spoken Assamese audio prompts (`as-IN`) for key operational cues:
* *Dispatch:* `"নতুন ভঙা-কুহילה আহিছে। গ্ৰহণ কৰিবলৈ সেউজীয়া বোটامটো টিপক।"`
* *Scale Tare:* `"স্কেল শূন্য কৰা হৈছে। এইবাৰ ওজন দিয়ক।"`
* *Payment:* `"গ্ৰাহকক টকা দিয়ক। আপোনাৰ লাভ ৱালেটত জমা হৈছে।"`

### 3.5 PostGIS SLA Dispatch Engine & Monsoon Ward Toggles
* **500m SLA Audit:** At $T-15\text{ minutes}$ prior to slot start, PostGIS evaluates collector proximity (`ST_DistanceSphere`). Collectors outside 500m trigger auto-reassignment and a ₹150 float penalty.
* **Monsoon Ward Suspension:** Admins can freeze flooded wards (Beltola, Jayanagar, Hatigaon) with a single toggle in `/apps/admin`, triggering automated customer SMS slot rescheduling notices.

---

## 4. Documentation Sitemap

Detailed technical and operational contracts reside inside the [`docs/`](file:///home/sumeet/Documents/kachracash/docs) folder:

* [`docs/AGENTS.md`](file:///home/sumeet/Documents/kachracash/docs/AGENTS.md) — Top-level system operating contract & autonomous agent rules.
* [`docs/PRD.md`](file:///home/sumeet/Documents/kachracash/docs/PRD.md) — Product requirements, user personas, SWM 2026 compliance, and FMEA edge cases.
* [`docs/ARCHITECTURE.md`](file:///home/sumeet/Documents/kachracash/docs/ARCHITECTURE.md) — Monorepo architecture blueprint, 14-table Prisma schema, and Neon serverless setup.
* [`docs/TDD.md`](file:///home/sumeet/Documents/kachracash/docs/TDD.md) — Vitest/Supertest executable test suites, pricing formulas, and scale anti-tamper tests.
* [`docs/DESIGN.md`](file:///home/sumeet/Documents/kachracash/docs/DESIGN.md) — Tailwind CSS design system tokens, WCAG 2.1 AAA contrast scales, and multimodal UI specs.

---

## 5. Getting Started & Local Development

### Prerequisites
* **Node.js:** `>= 20.x`
* **pnpm:** `>= 9.x`
* **PostgreSQL:** Neon Serverless PostgreSQL instance with PostGIS extension enabled.

### 1. Installation
```bash
git clone https://github.com/GreenOps26/KachraCash-V1.git
cd KachraCash-V1
pnpm install
```

### 2. Environment Variables
Copy `.env.example` to `.env` and fill in your Neon database connection strings:
```bash
cp .env.example .env
```

Ensure your `.env` contains both pooled and direct unpooled connection strings:
```bash
DATABASE_URL="postgresql://user:pass@ep-cool-lake-123456-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&pgbouncer=true"
DATABASE_URL_UNPOOLED="postgresql://user:pass@ep-cool-lake-123456.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
```

### 3. Database Migration & Data Seeding
```bash
# Push 14-table Prisma schema & PostGIS extensions to Neon
pnpm run db:push

# Seed Guwahati wards (Beltola, Jayanagar, etc.) and Floor Rate Cards
pnpm run db:seed
```

### 4. Run Development Servers
```bash
# Start all workspace apps concurrently (Next.js Admin, Expo Citizen, Expo Partner, Fastify API)
pnpm run dev
```

### 5. Static Analysis & Test Verification
```bash
# Run TypeScript strict type checking across all 6 workspace packages
pnpm run typecheck

# Run ESLint across workspace
pnpm run lint

# Run Vitest unit & integration test suites
pnpm run test
```

---

## 6. License

This repository is proprietary software developed for KachraCash (`কচৰা ক্যাশ`). All rights reserved.