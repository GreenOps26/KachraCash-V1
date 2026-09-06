# Product Requirements Document (PRD): KachraCash (`কচৰা ক্যাশ`)

> **Document Status:** Complete & Approved  
> **Version:** 1.1.0  
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

### 1.2 Statutory Compliance Framework: Solid Waste Management (SWM) Rules 2026
Under the mandated **Solid Waste Management (SWM) Rules 2026**, waste generators are legally obligated to segregate waste at source into four distinct streams:
1. **Dry Waste** (Recyclable paper, plastics, metals, glass)
2. **Wet Waste** (Biodegradable organic matter)
3. **Sanitary Waste** (Hazardous domestic hygiene waste)
4. **Special-Care Waste** (E-waste, household hazardous materials)

Furthermore, commercial establishments, high-rise residential complexes, and hospitality entities generating $>100\text{ kg/day}$ fall under **Extended Bulk Waste Generator Responsibility (EBWGR)** provisions. These entities face strict municipal fines unless they maintain digitally verifiable, auditable waste diversion certificates demonstrating zero-landfill disposal of dry recyclables.

### 1.3 Two-Layer Material Taxonomy & Downstream Liquidation Channels
To balance user simplicity with industrial fulfillment, KachraCash maps intake through a **Two-Layer Taxonomy**:
* **Layer 1 (Citizen UI):** 3-Stream visual selector (Rigid Containers, Soft Flexible Films & Paper, Mixed Bulky & Metals).
* **Layer 2 (Internal Engine):** Mapped internally to 8 granular scrap SKUs across SWM 2026 statutory streams.

```
       CITIZEN STREAM (LAYER 1)          INTERNAL SKUS (LAYER 2)            LIQUIDATION CHANNELS
       ┌────────────────────────┐        ┌───────────────────────┐          ┌───────────────────────────────────┐
       │ 🍾 Rigid Containers    │ ───┬──>│ PET Bottles, HDPE     │ ────────>│ Siliguri Corridor / WB Polymers   │
       └────────────────────────┘    │   └───────────────────────┘          │ (C_freight = ₹3.50/kg)            │
       ┌────────────────────────┐    │   ┌───────────────────────┐          └───────────────────────────────────┘
       │ 📦 Soft Films & Paper  │ ───┼──>│ LDPE, Cardboard, Paper│
       └────────────────────────┘    │   └───────────────────────┘          ┌───────────────────────────────────┐
       ┌────────────────────────┐    │   ┌───────────────────────┐          │ Byrnihat Induction Rolling Mills  │
       │ ⚙️ Mixed Bulky & Metals│ ───┴──>│ Ferrous Iron, Steel   │ ────────>│ (C_freight = ₹1.20/kg)            │
       └────────────────────────┘        └───────────────────────┘          └───────────────────────────────────┘
```

### 1.4 Strategic Positioning: Capital-Heavy vs. Asset-Light Model

| Strategic Dimension | ScrapUncle / Direct-Asset Model | KachraCash Asset-Light Marketplace Model |
| :--- | :--- | :--- |
| **Asset Ownership** | High CAPEX: Company-owned electric trucks, central sorting hubs, permanent warehouse leases. | Zero CAPEX: Micro-entrepreneur collectors (*Kabadiwalas*) utilize existing three-wheelers/rickshaws with standardized BLE scales. |
| **Operational Scalability** | Linear scaling limited by vehicle fleet acquisition and warehouse capacity. | Exponential hyper-local scaling driven by pre-funded collector wallet mechanics and dynamic zone dispatch. |
| **Fixed Cost Overhead** | Massive fixed payroll for drivers, warehouse staff, and fleet maintenance. | Variable operational costs; platform monetizes via an automated **8% take-rate** per executed transaction. |
| **Guwahati Geography Adaptation** | Heavy trucks struggle in narrow bypass lanes of Hatigaon, Jayanagar, and hilly terrain. | Local gig collectors seamlessly navigate narrow residential lanes (*golis*) and high-density markets. |

---

## 2. Phased Product Scope & Anti-Features

### 2.1 Release Phasing Strategy
To ensure immediate execution focus, KachraCash strictly enforces a phased feature release schedule:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        PHASED RELEASE ROADMAP                          │
├──────────────────────────┬──────────────────────────┬──────────────────┤
│ PHASE 1 (MVP LAUNCH)     │ PHASE 1.5 (POST-LAUNCH)  │ PHASE 2 (MATURE) │
├──────────────────────────┼──────────────────────────┼──────────────────┤
│ • Fixed Floor Rate Cards │ • B2B Bulk Quotes (>100kg)│ • Dynamic Algorithmic│
│ • BLE Scale Telemetry    │ • Commercial Invoicing   │   Spot Bidding   │
│ • Pre-funded Wallets     │ • ERP Export Adapters    │ • Futures Index  │
│ • Instant UPI Payouts    │                          │ • EPR Credit Trading│
└──────────────────────────┴──────────────────────────┴──────────────────┘
```

* **Phase 1 (MVP Launch - MANDATED):** Fixed Floor Rate Cards, BLE scale ingestion, pre-funded floating escrow wallets, 4-digit OTP doorstep verification, instant UPI payouts.
* **Phase 1.5 (Postponed):** Negotiated B2B above-floor offers for commercial bulk pickups ($>100\text{ kg}$).
* **Phase 2 (Postponed):** Dynamic algorithmic spot bidding engine and Extended Producer Responsibility (EPR) credit trading.

### 2.2 Explicit MVP Non-Features (Cuts)
The following features are **explicitly forbidden** from being implemented in the Phase 1 codebase:
1. **NO Owned Fleets or Warehouses:** Platform operates strictly asset-light; zero company-owned trucks or physical sorting hubs.
2. **NO Full B2B Compliance SaaS / EPR Credit Exchange:** B2B commercial features limited strictly to basic PDF diversion certificates.
3. **NO Automated Weather AI Routing Engines:** Weather routing simplified to manual **Admin Ward Suspension Toggles**.
4. **NO Live Bidding / Reverse Auctions:** Price discovery locked strictly to Phase 1 Floor Rate Cards.

---

## 3. Hardware Sourcing & Day-1 Critical Path Integration

Bluetooth Low Energy (BLE) hanging scale integration ($0\text{--}50\text{ kg}$ capacity, $\pm 10\text{g}$ precision) is elevated to a **Day-1 parallel development dependency**.

### 3.1 Hardware Specifications
* **GATT Primary Service UUID:** `0000ffe0-0000-1000-8000-00805f9b34fb`
* **Weight Telemetry Characteristic:** `0000ffe1-0000-1000-8000-00805f9b34fb`
* **Precision & Range:** $0\text{--}50\text{ kg}$ range with calibrated $\pm 10\text{g}$ strain gauge load cell.
* **Security:** Microcontroller HMAC signature on 8-byte payload packets.

### 3.2 Visual Zero-Tare Verification Anti-Fraud Protocol
To prevent weighing fraud where collectors pre-tare or hang heavy hooks on the scale:
1. Upon connecting to paired BLE scale hardware, the Partner App presents a mandatory full-screen visual tare UI.
2. The scale stream must register `0.000 kg` with the hardware `isTared` bit set to `1`.
3. The app forces a camera check/tare confirmation step before the "Lock Weight" button is enabled.

---

## 4. User Personas & Detailed Profiles

### Persona A: Urban Homemaker
* **Name:** Dr. Ananya Bordoloi
* **Age:** 38 | **Location:** Jayanagar, Ward 24, Guwahati
* **Profile:** Medical practitioner living in a nuclear household; accumulates cardboard boxes, plastic packaging, and old newspapers.
* **Pain Points:** Unpredictable arrival of itinerant collectors, suspicion of scale tampering, lack of cash change.
* **Key Requirements:** Guaranteed 45-minute pickup windows, live BLE scale telemetry on phone screen, instant UPI payout.

### Persona B: Bulk Residential Estate Manager
* **Name:** Bikash Sarma
* **Age:** 45 | **Location:** Green Valley Heights (220 units), Beltola
* **Profile:** Facilities manager responsible for municipal compliance, waste management, and vendor logistics.
* **Pain Points:** Scrap accumulation overflowing secondary rooms, absence of SWM 2026 municipal compliance documentation.
* **Key Requirements:** Bulk pickup scheduling, monthly auditable EBWGR compliance certificates detailing material weights.

### Persona C: Commercial Hospitality General Manager
* **Name:** Pranjal Baruah
* **Age:** 42 | **Location:** Hotel Brahmaputra Grand, Ganeshguri
* **Profile:** GM of a 4-star hotel generating glass, corrugated box, and aluminum bottle waste daily.
* **Pain Points:** Loading dock clearance required before 07:00 AM, risk of branded bottle theft/refilling.
* **Key Requirements:** Pre-dawn (06:00 AM) scheduled pickup window, verified digital scale manifests, bottle-destruction certificates.

### Persona D: Itinerant Collector / Partner (*Kabadiwala*)
* **Name:** Babul Das / Ali
* **Age:** 29 | **Location:** Ischaguri / Wireless Colony, Guwahati
* **Profile:** Independent scrap collector operating a motorized auto-rickshaw; low digital literacy; fluent in spoken Assamese.
* **Pain Points:** Unpredictable daily earnings, price haggling, lack of working capital for larger scrap loads.
* **Key Requirements:** Visual & Assamese voice UI, clustered pickup requests ($<1.5\text{ km}$), guaranteed floor rate card margins.

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

### 5.1 Failure Mode 1: Collector Mid-Route Float Depletion
* **Scenario:** A collector accepts a route of 4 pickups. After completing 2 high-tonnage commercial stops, their float balance drops to ₹800 (below the ₹2,000 threshold), threatening to block remaining assigned pickups.
* **Software Safeguards:**
  1. **Instant UPI Intent Top-up:** Single-tap deep link opening PhonePe/GooglePay/Paytm inside `/apps/partner` for instant float recharge.
  2. **Provisional Float Credit Line:** Algorithmic system automatically grants a temporary **+₹1,000 float extension** for active routes with confirmed pending pickups, preventing route disruption while maintaining audit tracking.

### 5.2 Failure Mode 2: Doorstep Network Dead Zones
* **Scenario:** Doorstep pickup occurs in a subterranean basement or shielded narrow lane (e.g., Wireless/Hatigaon) with zero cellular signal.
* **Software Safeguards:**
  1. **Signed Offline SQLite Queue:** The Partner App encrypts and queues the transaction payload (BLE scale data, timestamp, scale ID, order ID) locally in `sqflite`.
  2. **SMS Promissory Receipt:** The app generates a local offline SMS receipt payload sent directly to the citizen's mobile number, providing cryptographic proof of transaction prior to cloud sync upon network restoration.
  3. **Strict No-Cash Policy:** Physical cash payout fallback is strictly prohibited even during offline mode.

### 5.3 Failure Mode 3: Monsoon Ward Waterlogging & Flash Floods
* **Scenario:** Heavy monsoon downpours cause acute flash flooding in low-lying wards (**Beltola, Jayanagar, Hatigaon, Zoo Road**).
* **Software Safeguard:**
  1. **Admin Ward Suspension Toggle:** Operations managers use the `/apps/admin` dashboard to manually flip a ward status to `SUSPENDED`.
  2. **Automated Customer Rescheduling:** Instant automated SMS notifications are dispatched to all citizens with active bookings in suspended wards, offering one-tap slot rescheduling without penalties.

---

## 6. Monetization & Unit Economics

### 6.1 Pricing Math & Take-Rate Structure
KachraCash operates on a **8% baseline platform take-rate**, providing transparent, deterministic revenue while guaranteeing fair margins for collectors and citizens.

$$\text{Gross Transaction Value } (G) = \sum_{i=1}^{n} (\text{Weight}_i \times \text{Rate}_i)$$
$$\text{Platform Take-Rate Fee } (F) = G \times \text{TakeRatePercentage}$$
$$\text{Net Citizen Payout } (P) = G - F$$

#### Tiered Take-Rate Structure

| Segment / Collector Tier | Pickup Threshold / Condition | Take-Rate | Rationale / Operational Alignment |
| :--- | :--- | :--- | :--- |
| **High-Volume Partner Tier** | $>25\text{ weekly pickups}$ | **6.0%** | Incentivizes high-frequency gig collectors; rewards network density. |
| **Standard Partner Tier** | Baseline ($0 - 25\text{ weekly pickups}$) | **8.0%** | Baseline platform commission structure. |
| **Commercial / Multi-Floor** | Commercial bulk ($>100\text{ kg/pickup}$) | **10.0%** | Covers multi-story labor, dock clearance, and formal SWM compliance certification. |

---

## Summary Acceptance Matrix

| Module | Feature | Success Metric / Verification Criteria |
| :--- | :--- | :--- |
| `/apps/citizen` | 45-Min Scheduling | 95%+ pickups completed within reserved slot window. |
| `/apps/partner` | BLE Telemetry | 100% of recorded weights streamed from authenticated BLE scale payload. |
| `/apps/partner` | Mid-Route Float Extension | Zero active route cancellations due to float depletion mid-route. |
| `/apps/admin` | Ward Suspension Toggle | Suspends ward pickups and dispatches automated rescheduling SMS within <30 seconds. |
| `/packages/api` | Wallet Transaction | Atomic `$transaction` execution with zero negative wallet balance over-debits. |
