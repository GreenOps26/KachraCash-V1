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

### 2.3 Strict Architectural Import Boundaries

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
└─────────────────────────────────────────────────────────────┘
```

* **Client Isolation:** Applications (`/apps/citizen`, `/apps/partner`, `/apps/admin`) MUST NEVER import `/packages/db` directly or instantiate database connections.
* **API Contract Enforcement:** Clients communicate with backend services strictly via RPC/HTTP contracts provided by `/packages/api` or strongly typed client SDKs derived from `/packages/types`.
* **Shared Types:** Shared validation logic, Zod DTOs, and interface definitions reside exclusively in `/packages/types`.

---

## 3. Strict Anti-Patterns & Hard Guardrails (Forbidden Patterns)

Autonomous agents MUST REJECT and NEVER GENERATE code that violates the following guardrails:

### 3.1 Hard Ban: NO Live Bidding / Real-Time Reverse Auctions
* **Forbidden:** WebSocket-based live bidding engines, collector auction countdown timers, custom quote negotiations, or variable doorstep bidding interfaces.
* **Mandated Pricing Logic:** All scrap commodity pricing MUST be deterministically calculated using the **Phase 1 Floor Rate Card Algorithm**.
```typescript
// MANDATED: Deterministic Floor Rate Calculation
export function calculatePayout(weightKg: number, ratePerKg: number) {
  const grossAmount = weightKg * ratePerKg;
  const platformFee = grossAmount * 0.08; // Enforce 8% take-rate
  const citizenPayout = grossAmount - platformFee; // 92% net payout
  return { grossAmount, platformFee, citizenPayout };
}
```

### 3.2 Hard Ban: NO Manual Scrap Weight Text Inputs (Hardware Day-1 Path)
* **Day-1 Dependency:** Bluetooth Low Energy (BLE) scale integration (`GATT UUID: 0000ffe0-0000-1000-8000-00805f9b34fb`) is a mandatory Day-1 critical path dependency.
* **Forbidden:** Editable `<input type="number">` or text entry fields for scrap weight in `/apps/partner`. Mock implementations replacing raw BLE GATT byte streaming in production controllers are **strictly prohibited**.
* **Mandated Weight Ingestion:** Weight data MUST originate strictly from authenticated hardware BLE telemetry streams.
```typescript
// MANDATED: Weight Ingestion via Signed BLE Telemetry
export interface BLEWeightTelemetryPacket {
  scaleId: string;
  weightGrams: number;
  signature: string; // HMAC signature from scale microcontroller
  timestamp: number;
}
```

### 3.3 Hard Ban: NO Doorstep Cash Settlement & Offline Queue Mandate
* **Forbidden:** "Mark as paid in cash", manual physical cash ledger toggles, or cash fallback mechanisms during payment gateway timeouts or network drops.
* **Mandated Settlement:** 100% of customer payouts must execute programmatically via Cashfree/RazorpayX UPI payout rails triggered by customer OTP.
* **Offline Transaction Queue:** If cellular connectivity drops during doorstep pickup, the app MUST queue a cryptographically signed transaction payload (containing BLE weight telemetry, timestamp, scale ID, and order ID) locally in SQLite (`sqflite`). The transaction syncs automatically when connectivity is restored, **without dispensing unverified cash or invoking cash fallbacks**.

### 3.4 Hard Ban: NO Monolithic App Merging
* **Forbidden:** Merging citizen (consumer) and partner (collector) user flows or UI components into a single application binary.

### 3.5 Pragmatic Climate Directive: Simple Admin Ward Suspension
* **Forbidden:** Building complex automated weather / IMD AI routing algorithms for the MVP.
* **Mandated Ward Toggle:** Enforce a simple **Admin Ward Suspension Toggle** module in `/apps/admin`. Operations desks manually toggle ward pickup suspensions during flash floods (e.g., Beltola, Jayanagar, Hatigaon), triggering automated SMS customer rescheduling.

---

## 4. Database & Transactional Integrity Directives

### 4.1 ACID Transactional Wallet Blocks & Append-Only Ledger Enforce
All financial balance updates, escrow holds, float debits, and wallet balance adjustments MUST be wrapped inside atomic ORM transaction blocks (`db.$transaction`).

**Rule:** Wallet mutations MUST NEVER update `floatBalance` directly without creating a corresponding append-only entry in `walletLedger` / `wallet_transactions` inside the same `$transaction` block.

```typescript
// MANDATED: Atomic Wallet Ledger Update & Append-Only Record
await db.$transaction(async (tx) => {
  const wallet = await tx.collectorWallet.findUniqueOrThrow({
    where: { userId: collectorId },
  });

  if (wallet.floatBalance < grossAmount) {
    throw new InsufficientFloatError("Collector float balance too low for payout.");
  }

  // 1. Debit Float Balance
  await tx.collectorWallet.update({
    where: { id: wallet.id },
    data: { floatBalance: { decrement: grossAmount } },
  });

  // 2. Append Ledger Entry (Mandatory Audit Trail)
  await tx.walletTransaction.create({
    data: {
      walletId: wallet.id,
      amount: new Prisma.Decimal(-grossAmount),
      type: "DEBIT",
      description: `Doorstep Settlement Payout for Order ${pickupOrderId}`,
      idempotencyKey: `PAYOUT_ORD_${pickupOrderId}`,
      referenceOrderId: pickupOrderId,
    },
  });
});
```

### 4.2 Dual Neon PostgreSQL Connection Strings
To avoid connection pool exhaustion on Neon Serverless Postgres, agents must configure and use dual connection strings:
* `DATABASE_URL_UNPOOLED`: Direct, unpooled connection reserved exclusively for Prisma/Drizzle schema migrations and DDL operations.
* `DATABASE_URL`: Connection pooled via PgBouncer, enforced for all runtime API queries and background workers.

### 4.3 PostGIS Spatial Indexing
All spatial coordinate fields for users, pickup locations, and service zones MUST use PostGIS geometry types and be indexed using `GIST` indexes.
* Database Geometry Format: `POINT(longitude latitude)` (SRID 4326).
* Radius Queries: Must utilize `ST_DWithin` or `ST_DistanceSphere` with spatial index acceleration.

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
4. **No Synthetic Mocks in Core Controllers:** Do not mock core business controllers, payout calculations, or transaction ledgers in production code paths. Unit tests must test pure functions directly, and integration tests must run against test database environments.

---

## Summary Checklist for Agents

| Requirement | Rule |
| :--- | :--- |
| **Type Safety** | TypeScript `strict: true`, zero `any`, Zod DTOs at all boundaries |
| **Client Platforms** | `/apps/partner`: Android-ONLY (1-2GB RAM Go); `/apps/citizen`: iOS/Android; `/apps/admin`: Desktop-ONLY |
| **Weight Telemetry** | Day-1 BLE GATT scale telemetry stream only; NO manual weight text inputs or controller mocks |
| **Pricing** | Floor Rate Card Algorithm only; NO live bidding / auctions |
| **Payouts & Offline** | Programmatic UPI (Cashfree/RazorpayX) + OTP; NO doorstep cash fallback; signed offline queue |
| **Climate Operations** | Admin Ward Suspension Toggle module for flooded wards (NO complex IMD AI routing engines) |
| **Database & Ledger**| Dual Neon URIs, atomic `$transaction` wallet updates paired with append-only `wallet_transactions` entries |
| **Verification** | Verify against `TDD.md` and run workspace typecheck & tests before finalizing |
