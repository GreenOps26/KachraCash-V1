# KachraCash Implementation Roadmap & Phases

> **System:** KachraCash (`কচৰা ক্যাশ`)  
> **Target Territory:** Guwahati, Assam  
> **Canonical phase model:** Aligned with [`PRD.md`](./PRD.md) §2.1  
> **Version:** 2.0.0

---

## Phase overview

| Phase | Name | Status | Summary |
|-------|------|--------|---------|
| **1** | MVP Pilot | **Current** | 5 pilot wards, BLE scales, floor rates, UPI payouts, manual monsoon toggles |
| **1.5** | B2B Bulk | Postponed | Negotiated above-floor offers for commercial bulk ($>100 kg) |
| **2** | Scale & Expansion | Planned | All 60 GMC wards, multilingual voice, wholesale hub dispatch |
| **3** | Industrial & Traceability | Planned | EPR compliance filing, batch barcoding, collector micro-credit |
| **4** | Marketplace (Deferred) | Out of scope | Dynamic spot bidding, EPR credit trading |

---

## Phase 1: Foundation, Hardware Day-1 & MVP Pilot (Current)

### Scope
* **Target wards:** Beltola (Ward 28), Jayanagar (Ward 24), Ganeshguri (Ward 29), Noonmati (Ward 15), Wireless/Hatigaon (Ward 30).
* **Hardware integration:** BLE hanging scales (0–50 kg, ±10g precision) paired to budget Android Go collector devices.
* **Pricing engine:** Deterministic Floor Rate Card formula (zero live bidding).
* **Take-rate:** Flat **8%** platform fee for all MVP transactions (tiered rates deferred to Phase 1.5).
* **Payment rails:** OTP-verified programmatic UPI transfers via Cashfree / RazorpayX.
* **Ledger security:** Append-only `wallet_ledger` with ACID `db.$transaction` execution.
* **Dispatch SLA:** 2-hour pickup slots; **T-15 minute** proximity check (500 m geofence) triggers auto-reassignment if collector is non-compliant.
* **Climate safeguard:** Manual Admin Monsoon Ward Suspension Toggle for flash-flooded streets.

### Exit criteria (pilot graduation)
* ≥ 250 completed pickups across pilot wards.
* 100% UPI payout success rate (excluding citizen-provided invalid VPAs).
* ≥ 15 active certified collectors with sustained float balances.
* SLA breach rate < 10% of assigned pickups.
* Zero confirmed weighing-fraud incidents on BLE-verified transactions.

### Implementation note
The repository is a **pnpm + Turborepo monorepo** with:
* `/apps/admin` — SvelteKit 5 admin console (web)
* `/apps/citizen` — React Native / Expo (iOS + Android)
* `/apps/partner` — React Native / Expo (Android-first collector APK)
* `/packages/types` — shared TypeScript + Zod contracts
* `/packages/ui` — Glade design tokens and React Native components

`packages/db` ships the Prisma schema, initial migration, and pilot seed (`pnpm db:migrate:deploy && pnpm db:seed`). Demo citizen + collector IDs are seeded for local E2E. `packages/api` exposes Fastify routes on port 3000 (`pnpm dev:api`) plus TDD unit tests (`pnpm test:unit`). Neon `DATABASE_URL` is configured locally; integration tests include full pickup HTTP E2E (`pickup-e2e.test.ts`).

**Pilot E2E (manual):** citizen books → partner accepts → BLE weigh + lock → citizen shows in-app OTP → partner completes → stub/live UPI payout. Set `PICKUP_DEV_OTP=true`, `COLLECTOR_DEV_AUTH=true`, and `PAYOUT_STUB_AUTO_CONFIRM=true` in API env for closed-pilot runs.

#### Phase 1 engineering progress (repo)

| Workstream | Status | Notes |
|------------|--------|-------|
| Monorepo scaffold (`apps/*`, `packages/*`) | **Done** | pnpm + Turborepo |
| Glade design system (web + RN) | **Done** | `@kachracash/ui` |
| Admin console shell | **Done** | SvelteKit ops desk — dispatch, wards, ledger, rates |
| Citizen app — booking + tracking | **Done** | 3-step wizard, pickup status poll, in-app OTP (C-05), receipt (C-07) |
| Partner app — weigh + settle | **Done** | Pending queue, accept, BLE weigh/lock, OTP settlement (P-04) |
| DB schema + Neon + seed | **Done** | 5 pilot wards, 4 SKUs, demo citizen + collector + ₹5k float |
| API services (pricing, wallet, SLA, pickup flow) | **Done** | Book, accept, complete, payout, admin dispatch/ledger |
| TDD unit tests | **Done** | Pricing, BLE parser, payout gateway |
| TDD integration tests | **Done** | Wallet, settlement, SLA, pickup HTTP E2E |
| BLE scale pairing + GATT stream | **In progress** | Simulator + `react-native-ble-plx`; hardware validation pending |
| UPI payout gateway (Cashfree/RazorpayX) | **In progress** | Adapters wired; **live keys required** for pilot graduation metric |
| Collector auth + JWT | **Done (pilot)** | Dev-login + Bearer on accept/complete; phone OTP login deferred |
| Citizen pickup booking E2E | **Done** | Full loop through settlement + payout (stub or live gateway) |
| Admin ward suspend UI | **Done** | `/admin/wards` — suspend/resume + confirm modal |
| Admin dispatch + ledger (live API) | **Done** | `/admin` + `/admin/ledger` wired to API |
| Pilot exit criteria (250 pickups, etc.) | **Not started** | Operational, not code |

#### Deferred past closed pilot (not blocking MVP)

| Item | Why deferred |
|------|----------------|
| Collector phone OTP login | Closed pilot uses pre-provisioned collectors + `COLLECTOR_DEV_AUTH` |
| SMS citizen OTP | PRD C-05 satisfied by in-app OTP at doorstep; SMS optional for no-app edge cases |
| Ward reschedule SMS (A-02) | Admin suspend UI done; MSG91 (or similar) integration post-pilot |
| Citizen live BLE mirror (C-04) | Nice-to-have during weigh; not required for settlement |
| Partner offline queue (P-05) | Required before low-connectivity rollout; not blocking first pilot ward |

---

## Phase 1.5: B2B Bulk & Tiered Pricing (Postponed)

* Negotiated above-floor offers for commercial bulk pickups ($>100 kg).
* **Tiered take-rate structure** (from PRD §6.1):
  * High-volume partner tier (>25 weekly pickups): 6.0%
  * Standard partner tier: 8.0%
  * Commercial / multi-floor (>100 kg/pickup): 10.0%
* Monthly auditable EBWGR compliance certificates for bulk waste generators.
* Estate and hospitality scheduling (loading-dock windows).

---

## Phase 2: Scale & Regional Expansion

* Expansion across all 60 Guwahati Municipal Corporation (GMC) wards.
* Institutional B2B scrap pickup scheduling for commercial complexes and housing societies.
* Multi-lingual voice engine additions (Bengali, Bodo, Hindi) alongside Assamese.
* Aggregated wholesale hub dispatch to Byrnihat and Siliguri recycling centers.

### Exit criteria
* Coverage in all 60 GMC wards with > 1 active collector per ward.
* Average collector daily earnings uplift ≥ 50% vs pre-platform baseline (per pitch-deck supply economics).

---

## Phase 3: Industrial Circular Economy & Traceability

* Enterprise EPR (Extended Producer Responsibility) automated compliance filing for FMCG brand partners.
* Automated batch barcoding for segregated polymer bales.
* Micro-credit underwriting for collector EV-rickshaw fleet upgrades based on wallet ledger history.
* SWM compliance reporting portal for bulk generators (audit manifests, diversion metrics).

---

## Phase 4: Marketplace Features (Deferred — Not Planned for Near Term)

> These features are explicitly **out of scope** per PRD anti-feature guardrails until a separate product review approves them.

* Dynamic algorithmic spot bidding engine.
* Extended Producer Responsibility (EPR) **credit trading** marketplace.

---

## Document cross-references

| Topic | Primary doc |
|-------|-------------|
| Product requirements & guardrails | [`PRD.md`](./PRD.md) |
| Feature list per app | [`PRD.md`](./PRD.md) §7 |
| System design & schema | [`ARCHITECTURE.md`](./ARCHITECTURE.md) |
| Test contract | [`TDD.md`](./TDD.md) |
| UX & design tokens | [`DESIGN.md`](./DESIGN.md) |