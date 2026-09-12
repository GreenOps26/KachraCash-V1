# Product Requirements Document (PRD): KachraCash (`কচৰা ক্যাশ`)

> **Document Status:** Complete (v2.1 — reconciled with `PHASES.md`, `ARCHITECTURE.md`, `TDD.md`)  
> **Version:** 2.1.0  
> **Target Market:** Guwahati Metro Region, Assam, Northeast India  
> **Author:** Staff Product Manager & Systems Architect  
> **Target Apps:** `/apps/citizen`, `/apps/partner`, `/apps/admin`

---

## 1. Executive Summary & Problem Validation

### 1.1 Municipal Waste Infrastructure Failure in Guwahati
Guwahati, the primary economic gateway of Northeast India, suffers from severe municipal solid waste management bottlenecks. Municipal collection coverage across key residential and commercial hubs—including **Beltola, Jayanagar, Ganeshguri, Wireless/Hatigaon, and Noonmati**—is inconsistent, fragmented, and under-resourced. 

Existing informal recycling supply chains rely on itinerant waste pickers (*Kabadiwalas*) operating with analog spring scales prone to mechanical tampering (up to 20–30% weight manipulation), price haggling, unpredictable door-to-door visits, and non-transparent pricing.

```
       INFORMAL SCRAP CHAIN (TRADITIONAL)
       [Citizen] ──(Analog Scale/Haggle)──> [Itinerant Collector] ──> [Wholesale Dealer] ──> [Recycler]
       
       KACHRACASH ASSET-LIGHT PLATFORM
       [Citizen] <──(BLE Telemetry/UPI)──> [Gig Collector (Pre-funded Wallet)] <──(Rate Card API)──> [KachraCash Platform]
```

### 1.2 Citizen Value Proposition: Byewaste 3-Step Promise
KachraCash grounds its consumer experience in a clear 3-step value promise:

$$\text{Schedule} \longrightarrow \text{Weigh Transparently} \longrightarrow \text{Instant UPI Payout}$$

1. **Schedule:** 3-tap booking for guaranteed 2-hour doorstep pickup slots.
2. **Weigh Transparently:** Hardware-locked BLE scale streaming live telemetry directly to the resident's screen.
3. **Instant UPI Payout:** Programmatic 92% net disbursement directly to the citizen's bank account via UPI upon 4-digit OTP verification.

### 1.3 Statutory Compliance Framework: Solid Waste Management (SWM) Rules, 2016
Under India's **Solid Waste Management (SWM) Rules, 2016** (and applicable Assam state amendments), waste generators are legally obligated to segregate waste at source into four distinct streams:
1. **Dry Waste** (Recyclable paper, plastics, metals, glass)
2. **Wet Waste** (Biodegradable organic matter)
3. **Sanitary Waste** (Hazardous domestic hygiene waste)
4. **Special-Care Waste** (E-waste, household hazardous materials)

Commercial establishments, high-rise residential complexes, and hospitality entities generating $>100\text{ kg/day}$ fall under **Extended Bulk Waste Generator Responsibility (EBWGR)** provisions.

### 1.4 Two-Layer Material Taxonomy & Downstream Liquidation Channels
To balance user simplicity with industrial fulfillment, KachraCash maps intake through a **Two-Layer Taxonomy**:
* **Layer 1 (Citizen UI):** 3-Stream visual selector (Rigid Containers, Soft Flexible Films & Paper, Mixed Bulky & Metals).
* **Layer 2 (Internal Engine):** Mapped internally to 8 granular scrap SKUs across the four SWM statutory streams.

Photo uploads during booking are strictly designated as an **optional price protection dispute baseline**. Photo uploads do **NOT** invoke automated AI computer-vision pricing scanners or algorithmic material grading.

---

## 2. Phased Product Scope & Disintermediation Guardrails

### 2.1 Release Phasing Strategy

> Full roadmap with exit criteria: see [`PHASES.md`](./PHASES.md).

* **Phase 1 (MVP Pilot — MANDATED):** Fixed Floor Rate Cards, BLE scale ingestion, pre-funded floating escrow wallets, 4-digit OTP doorstep verification, instant UPI payouts, flat 8% take-rate.
* **Phase 1.5 (Postponed):** Negotiated B2B above-floor offers and tiered take-rates for commercial bulk pickups ($>100\text{ kg}$).
* **Phase 2 (Planned):** All 60 GMC wards, multilingual voice, wholesale hub dispatch.
* **Phase 3 (Planned):** EPR compliance filing, batch barcoding, collector micro-credit.
* **Phase 4 (Deferred):** Dynamic algorithmic spot bidding engine and EPR credit trading.

### 2.2 Strict Disintermediation & Anti-Feature Guardrails
1. **NO Third-Party Cash Agents or Doorstep Cash Handoffs:** Payouts remain strictly programmatic UPI micro-transfers executed via Cashfree/RazorpayX triggered by the resident's 4-digit OTP verification. Third-party cash-out agents and physical banknote ledgers are strictly rejected.
2. **NO Computer Vision AI Pricing Scanners:** Photo uploads function strictly as optional dispute evidence for admin arbitration, never for automated real-time computer vision price estimation.
3. **NO Owned Fleets or Warehouses:** Platform operates strictly asset-light; zero company-owned trucks or physical sorting hubs.
4. **NO Automated Weather AI Routing Engines:** Weather routing simplified to manual **Admin Ward Suspension Toggles**.

---

## 3. Hardware Sourcing & Day-1 Integration

Bluetooth Low Energy (BLE) hanging scale integration ($0\text{--}50\text{ kg}$ capacity, $\pm 10\text{g}$ precision) is elevated to a **Day-1 parallel development dependency**.

### 3.1 Hardware Specifications
* **GATT Primary Service UUID:** `0000ffe0-0000-1000-8000-00805f9b34fb`
* **Weight Telemetry Characteristic:** `0000ffe1-0000-1000-8000-00805f9b34fb`
* **Precision & Range:** $0\text{--}50\text{ kg}$ range with calibrated $\pm 10\text{g}$ strain gauge load cell.
* **Security:** Microcontroller HMAC signature on 8-byte payload packets.

### 3.2 Visual Zero-Tare Verification Anti-Fraud Protocol
1. Upon connecting to paired BLE scale hardware, the Partner App presents a mandatory full-screen visual tare UI.
2. The scale stream must register `0.000 kg` with the hardware `isTared` bit set to `1`.
3. The app forces a tare confirmation step before the "Lock Weight" button is enabled.

---

## 4. User Personas & Detailed Profiles

* **Persona A (Urban Homemaker):** Dr. Ananya Bordoloi (Jayanagar) — 2-hour scheduled windows, transparent BLE weighment, instant UPI payout.
* **Persona B (Bulk Estate Manager):** Bikash Sarma (Green Valley Heights, Beltola) — Bulk generator ($>100\text{ kg/day}$), turnkey collection, monthly auditable EBWGR compliance certificates.
* **Persona C (Hospitality GM):** Pranjal Baruah (Hotel Brahmaputra Grand, Ganeshguri) — 06:00 AM loading dock clearance, verified digital scale manifests, bottle-destruction certificates.
* **Persona D (Itinerant Collector):** Babul Das / Ali (Wireless Colony) — Hyper-local route clustering, Assamese voice UI, guaranteed floor rates, pre-funded wallet mechanics.

---

## 5. Operational Failure Mode & Effects Analysis (FMEA)

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                               OPERATIONAL FMEA MATRIX                                 │
├──────────────────────┬───────────────────────────────┬─────────────────────────────────┤
│ Failure Mode         │ Root Cause                    │ KachraCash Software Safeguard   │
├──────────────────────┼───────────────────────────────┼─────────────────────────────────┤
│ Weighing Fraud       │ Manual scale tampering        │ BLE GATT telemetry + Zero-Tare  │
│ Float Depletion      │ High-tonnage pickups mid-route│ Auto-UPI Topup + ₹1,000 Line    │
│ Network Dead Zone    │ Cellular drop in dense lane   │ Signed SQLite Queue + SMS Receipt│
│ Monsoon Flash Flood  │ Waterlogging in Beltola/Hatigaon│ Admin Ward Suspension Toggle  │
│ Material Downgrade   │ Doorstep price renegotiation │ Visual photo baseline + resident veto│
│ Collector No-Show    │ Traffic / multi-booking       │ T-15 min 500m geofence & auto-reassign│
└──────────────────────┴───────────────────────────────┴─────────────────────────────────┘
```

---

## 6. Monetization & Unit Economics

### 6.1 Pricing Math & Take-Rate Structure
KachraCash operates on a **8% baseline platform take-rate**:

$$\text{Gross Transaction Value } (G) = \sum_{i=1}^{n} (\text{Weight}_i \times \text{Rate}_i)$$
$$\text{Platform Take-Rate Fee } (F) = G \times \text{TakeRatePercentage}$$
$$\text{Net Citizen Payout } (P) = G - F$$

#### Tiered Take-Rate Structure (Phase 1.5+)

> **MVP (Phase 1) uses a flat 8.0% take-rate for all transactions.** Tiered rates below activate only after Phase 1.5 B2B bulk launch.

* **High-Volume Partner Tier ($>25\text{ weekly pickups}$):** 6.0% take-rate.
* **Standard Partner Tier (Baseline):** 8.0% take-rate.
* **Commercial / Multi-Floor ($>100\text{ kg/pickup}$):** 10.0% take-rate.

---

## 7. Functional Requirements by Application

### 7.1 `/apps/citizen` (Consumer App)

| ID | Requirement | Acceptance criteria |
|----|-------------|---------------------|
| C-01 | 3-tap booking | User selects visual tier, 2-hour slot, and confirms pickup in ≤ 3 primary taps from home |
| C-02 | Floor rate display | Selected tier shows current floor rate (₹/kg) before booking confirmation |
| C-03 | Optional dispute photo | User may attach photo labeled "for price protection"; photo does **not** change quoted rate |
| C-04 | Live BLE telemetry | During weighing, citizen screen mirrors partner scale stream with tare indicator |
| C-05 | OTP reveal timing | 4-digit OTP displayed only after weighing completes and subtotal is locked |
| C-06 | Instant UPI payout | Net amount (gross − 8% fee) credited to citizen VPA within 60s of OTP verification |
| C-07 | Transaction receipt | Post-settlement slip shows weight, rate, gross, fee, net payout, and timestamp |

### 7.2 `/apps/partner` (Collector App — Android only)

| ID | Requirement | Acceptance criteria |
|----|-------------|---------------------|
| P-01 | Float gate | Online toggle disabled when `floatBalance < ₹2,000` |
| P-02 | BLE-only weight | No manual numeric weight input; all weights from signed BLE packets |
| P-03 | Zero-tare protocol | "Lock Weight" disabled until `isTared = 1` and weight reads `0.000 kg` |
| P-04 | OTP settlement | 4-digit OTP entry triggers API settlement; Assamese TTS success audio plays on confirm |
| P-05 | Offline queue | Transactions signed and queued locally when offline; replay is idempotent on sync |
| P-06 | Provisional float | Active-route collector may receive +₹1,000 provisional buffer when float depletes mid-route |
| P-07 | SOS button | 3-second press triggers ops desk alert with GPS coordinates |

### 7.3 `/apps/admin` (Operations Console — Desktop)

| ID | Requirement | Acceptance criteria |
|----|-------------|---------------------|
| A-01 | Dispatch radar | Live map of collectors and active pickups with SLA color coding |
| A-02 | Ward suspension | One-click flood suspend per ward; blocks new bookings and triggers reschedule SMS |
| A-03 | Rate card manager | Admin publishes versioned floor rates; in-flight orders retain rate at booking time |
| A-04 | Float ledger desk | Real-time collector float with append-only ledger audit trail |
| A-05 | Dispute queue | Side-by-side photo + transaction review with 1-tap arbitration outcome |

---

## 8. Pickup Order State Machine

```
PENDING → ASSIGNED → EN_ROUTE → ARRIVED → WEIGHING → COMPLETED
                ↓                              ↓
           REASSIGNED                        DISPUTED
                ↓
           CANCELLED (admin or citizen, pre-weighing only)
```

| Transition | Triggered by | Preconditions |
|------------|--------------|---------------|
| PENDING → ASSIGNED | Dispatch engine | Collector float ≥ ₹2,000; ward not suspended |
| ASSIGNED → REASSIGNED | T-15 SLA job | Collector > 500 m from pickup or no GPS |
| WEIGHING → COMPLETED | OTP verified | BLE weights locked; `isTared` recorded; wallet debited atomically |
| COMPLETED → DISPUTED | Citizen or admin | Within 48-hour dispute window |

---

## 9. Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| **Availability** | API 99.5% uptime during pilot hours (07:00–20:00 IST) |
| **Payout latency** | UPI disbursement initiated within 60s of OTP verification |
| **Offline tolerance** | Partner app queues up to 20 signed transactions locally |
| **Accessibility** | WCAG 2.1 AA minimum; partner app uses voice + icon + text multimodal UI |
| **Localization** | Assamese (`as-IN`) TTS on partner app; English UI labels on citizen app |
| **Security** | BLE HMAC validation; OTP bcrypt-hashed; idempotent payout webhooks |
| **Data residency** | PostgreSQL hosted in `ap-south-1` (Mumbai) via Neon |

---

## 10. Success Metrics (Phase 1 Pilot)

| Metric | Target |
|--------|--------|
| Completed pickups | ≥ 250 |
| UPI payout success rate | 100% (excl. invalid VPAs) |
| Active certified collectors | ≥ 15 |
| SLA breach rate | < 10% of assigned pickups |
| Weighing fraud incidents | 0 on BLE-verified transactions |
| Average citizen NPS | ≥ 40 |

---

## 11. Explicitly Out of Scope (Phase 1)

* Live reverse auctions or collector bidding
* Computer-vision material grading or AI price estimation
* Doorstep cash settlement or third-party cash agents
* Company-owned fleet or sorting warehouses
* Automated weather/IMD routing (manual ward toggle only)
* Tiered take-rates (deferred to Phase 1.5)
* EPR credit trading (deferred to Phase 4)

---

## 12. External Dependencies & Integrations

| System | Purpose | Phase |
|--------|---------|-------|
| Cashfree / RazorpayX | UPI payout rails | 1 |
| Neon PostgreSQL + PostGIS | Primary datastore & geospatial dispatch | 1 |
| BLE hanging scale (GATT `0000ffe0`) | Certified weight telemetry | 1 |
| SMS gateway (e.g. MSG91) | OTP delivery, reschedule notifications | 1 |
| Assamese TTS engine | Partner voice prompts | 1 |
| Object storage (S3-compatible) | Dispute photo evidence | 1 |

---

## 13. Open Decisions Log

| # | Decision | Status | Notes |
|---|----------|--------|-------|
| D-01 | Primary payout gateway (Cashfree vs RazorpayX) | Open | Evaluate sandbox fees and Assam merchant onboarding |
| D-02 | Admin app framework (Next.js vs SvelteKit) | Open | Repo currently has SvelteKit scaffold; admin target TBD |
| D-03 | Monorepo package manager (npm vs pnpm) | Open | Root uses npm; architecture doc targets pnpm + Turborepo |
| D-04 | Collector provisional float (+₹1,000) auto vs manual | Open | TDD assumes auto for active-route flag |
