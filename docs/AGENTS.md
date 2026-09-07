# AGENTS.md — System Operating Contract for Autonomous Coding Agents

> **Repository:** KachraCash (`কচৰা ক্যাশ`)  
> **Domain:** Asset-light, two-sided circular economy and scrap-tech platform tailored for Guwahati, Assam, Northeast India.  
> **Target Autonomous Agents:** Cursor, Antigravity, Pi Agent, and LLM coding assistants.  
> **Status:** Top-Level Operating Contract (Non-negotiable).

---

## 1. System Persona & Operational Mandate

### 1.1 Agent Role
You are acting as an elite **Principal AI Software Architect and Senior Systems Engineer** for KachraCash. Your mandate is to maintain, build, refactor, and verify code within this monorepo while enforcing absolute type safety, financial transaction integrity, spatial efficiency, and physical-world operational safeguards.

### 1.2 Non-Negotiable Engineering Standards
* **TypeScript Strict Mode:** Enforce strict mode (`"strict": true`) across all applications and shared packages (`/apps/*`, `/packages/*`).
* **Zero `any` Policy:** The `any` type is strictly forbidden. Use explicit interfaces, generics, discriminated unions, or `unknown` with runtime type narrowing.
* **Schema Validation at Boundaries:** Every API request, response, environment variable, and external telemetry payload MUST be validated using Zod schemas before touching business logic.
* **Domain Awareness:** All operational workflows reflect local conditions in Guwahati (Assam, India)—including low-bandwidth network connectivity, multi-lingual audio/UI support (Assamese/English), and hardware scale integrations.

---

## 2. Monorepo Structure & Target Client Distribution Rules

### 2.1 Directory Layout & Target Distribution Tree

```
kachracash/
├── apps/
│   ├── citizen/             # Cross-platform consumer mobile app (React Native / Expo: iOS & Android)
│   ├── partner/             # Collector APK (Android-ONLY, low-resource optimized for 1-2 GB RAM Android Go)
│   └── admin/               # Operations & logistics portal (Desktop-ONLY Next.js App Router)
├── packages/
│   ├── db/                  # Prisma ORM targeting Neon Postgres + PostGIS
│   ├── api/                 # Shared tRPC / Fastify routers, controllers & middleware
│   └── types/               # Shared Zod schemas, TypeScript types & BLE payload definitions
├── docs/                    # Project documentation (AGENTS.md, ARCHITECTURE.md, PRD.md, TDD.md, DESIGN.md)
└── package.json             # Monorepo root configuration (pnpm / Turbo workspace)
```

### 2.2 Client Distribution Directives
1. **`/apps/partner` (Android-ONLY):** Strictly optimized for budget Android devices (1–2 GB RAM, Android Go edition). Autonomous agents are **strictly forbidden** from scaffolding iOS targets, adding Apple App Store configurations, or importing heavy UI/animation libraries (e.g., Lottie, complex Framer Motion setups).
2. **`/apps/citizen` (Cross-Platform):** Built with React Native / Expo targeting both iOS and Android platforms with quick-commerce UX expectations.
3. **`/apps/admin` (Desktop-ONLY):** Built with Next.js App Router and Tailwind CSS, optimized exclusively for desktop screens and logistics operation desks.

---

## 3. Strict Anti-Patterns & Explicit Negative Constraints (FORBIDDEN Patterns)

Autonomous agents MUST REJECT and NEVER GENERATE code that violates the following guardrails:

### 3.1 Hard Ban: NO Live Bidding / Real-Time Reverse Auctions
* **FORBIDDEN:** WebSocket-based live bidding engines, collector auction countdown timers, custom quote negotiations, or variable doorstep bidding interfaces.
* **Mandated Pricing Logic:** All scrap commodity pricing MUST be deterministically calculated using the **Phase 1 Floor Rate Card Algorithm**.

### 3.2 Hard Ban: NO Manual Scrap Weight Text Inputs (Hardware Day-1 Path)
* **FORBIDDEN:** Editable `<input type="number">` or text entry fields for scrap weight in `/apps/partner`. Mock implementations replacing raw BLE GATT byte streaming in production controllers are **strictly prohibited**.
* **Mandated Weight Ingestion:** Weight data MUST originate strictly from authenticated hardware BLE telemetry streams (`GATT UUID: 0000ffe0-0000-1000-8000-00805f9b34fb`).

### 3.3 Hard Ban: NO Doorstep Cash Settlement & NO Cash-Collection Agents
* **FORBIDDEN:** Never scaffold doorstep cash handling, cash-collection agents, physical banknote workflows, "Mark as paid in cash" toggles, or cash fallback mechanisms during payment gateway timeouts or network drops.
* **Mandated Settlement:** 100% of customer payouts must execute programmatically via Cashfree/RazorpayX UPI payout rails triggered by customer OTP.

### 3.4 Hard Ban: NO External Computer Vision AI Pricing Scanners
* **FORBIDDEN:** Never install or scaffold external computer vision packages (OpenCV, Google Vision, Roboflow, TensorFlow Lite) for real-time price estimation or automated category grading. Scrap photo uploads function strictly as optional dispute baseline evidence for human admin arbitration.

### 3.5 Hard Ban: NO Unconstrained Float Bypass Toggles in `@apps/partner`
* **FORBIDDEN:** Never permit unconstrained "Online/Offline" toggle switches in `@apps/partner` that bypass the ₹2,000 float balance gate. The status toggle MUST remain strictly locked in the disabled/red state whenever `floatBalance < ₹2,000`.

### 3.6 Hard Ban: NO Monolithic App Merging
* **FORBIDDEN:** Merging citizen (consumer) and partner (collector) user flows or UI components into a single application binary.

### 3.7 Pragmatic Climate Directive: Simple Admin Ward Suspension
* **FORBIDDEN:** Building complex automated weather / IMD AI routing algorithms for the MVP.
* **Mandated Ward Toggle:** Enforce a simple **Admin Ward Suspension Toggle** module in `/apps/admin`. Operations desks manually toggle ward pickup suspensions during flash floods.

---

## 4. Database & Transactional Integrity Directives

### 4.1 ACID Transactional Wallet Blocks & Append-Only Ledger Enforce
All financial balance updates, escrow holds, float debits, and wallet balance adjustments MUST be wrapped inside atomic ORM transaction blocks (`db.$transaction`).

**Rule:** Wallet mutations MUST NEVER update `floatBalance` directly without creating a corresponding append-only entry in `walletLedger` / `wallet_transactions` inside the same `$transaction` block.

---

## 5. Verification Protocol Before Output

Before declaring any code change complete, autonomous agents MUST perform the following verification workflow:

1. **Consult `TDD.md`:** Review the exact test cases and requirements in `TDD.md` to ensure full test coverage for modified features.
2. **Execute Static Analysis & Type Checking:**
   ```bash
   pnpm run typecheck
   pnpm run lint
   ```
3. **Run Unit & Integration Test Suite:**
   ```bash
   pnpm run test
   ```
4. **No Synthetic Mocks in Core Controllers:** Do not mock core business controllers, payout calculations, or transaction ledgers in production code paths.
