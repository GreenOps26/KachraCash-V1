# Product Requirements Document (PRD): KachraCash (`কচৰা ক্যাশ`)

> **Document Status:** Complete & Approved  
> **Version:** 2.0.0  
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

### 1.3 Statutory Compliance Framework: Solid Waste Management (SWM) Rules 2026
Under the mandated **Solid Waste Management (SWM) Rules 2026**, waste generators are legally obligated to segregate waste at source into four distinct streams:
1. **Dry Waste** (Recyclable paper, plastics, metals, glass)
2. **Wet Waste** (Biodegradable organic matter)
3. **Sanitary Waste** (Hazardous domestic hygiene waste)
4. **Special-Care Waste** (E-waste, household hazardous materials)

Commercial establishments, high-rise residential complexes, and hospitality entities generating $>100\text{ kg/day}$ fall under **Extended Bulk Waste Generator Responsibility (EBWGR)** provisions.

### 1.4 Two-Layer Material Taxonomy & Downstream Liquidation Channels
To balance user simplicity with industrial fulfillment, KachraCash maps intake through a **Two-Layer Taxonomy**:
* **Layer 1 (Citizen UI):** 3-Stream visual selector (Rigid Containers, Soft Flexible Films & Paper, Mixed Bulky & Metals).
* **Layer 2 (Internal Engine):** Mapped internally to 8 granular scrap SKUs across SWM 2026 statutory streams.

Photo uploads during booking are strictly designated as an **optional price protection dispute baseline**. Photo uploads do **NOT** invoke automated AI computer-vision pricing scanners or algorithmic material grading.

---

## 2. Phased Product Scope & Disintermediation Guardrails

### 2.1 Release Phasing Strategy
* **Phase 1 (MVP Launch - MANDATED):** Fixed Floor Rate Cards, BLE scale ingestion, pre-funded floating escrow wallets, 4-digit OTP doorstep verification, instant UPI payouts.
* **Phase 1.5 (Postponed):** Negotiated B2B above-floor offers for commercial bulk pickups ($>100\text{ kg}$).
* **Phase 2 (Postponed):** Dynamic algorithmic spot bidding engine and Extended Producer Responsibility (EPR) credit trading.

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
│ Collector No-Show    │ Traffic / multi-booking       │ 45-min SLA geofence & auto-reassign│
└──────────────────────┴───────────────────────────────┴─────────────────────────────────┘
```

---

## 6. Monetization & Unit Economics

### 6.1 Pricing Math & Take-Rate Structure
KachraCash operates on a **8% baseline platform take-rate**:

$$\text{Gross Transaction Value } (G) = \sum_{i=1}^{n} (\text{Weight}_i \times \text{Rate}_i)$$
$$\text{Platform Take-Rate Fee } (F) = G \times \text{TakeRatePercentage}$$
$$\text{Net Citizen Payout } (P) = G - F$$

#### Tiered Take-Rate Structure
* **High-Volume Partner Tier ($>25\text{ weekly pickups}$):** 6.0% take-rate.
* **Standard Partner Tier (Baseline):** 8.0% take-rate.
* **Commercial / Multi-Floor ($>100\text{ kg/pickup}$):** 10.0% take-rate.
