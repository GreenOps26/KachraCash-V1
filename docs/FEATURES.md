# KachraCash Feature Matrix & Functional Specifications

> **System:** KachraCash (`কচৰা ক্যাশ`)  
> **Market:** Guwahati Municipal Corporation (GMC), Assam, India

---

## 1. Feature Breakdown by Application

### 1.1 `/apps/citizen` (Consumer Quick-Commerce Scrap App)
* **3-Tier Simplified Category Selector:** Rigid Containers, Soft Film & Paper, Bulky & Metals.
* **Guaranteed Floor Rate Display:** Transparent baseline commodity rates (zero live bidding).
* **2-Hour Pickup Window Booking:** Morning, afternoon, and evening booking slots.
* **Live BLE Scale Telemetry Readout:** Streaming weight display with verified baseline tare indicator.
* **Doorstep OTP Generation:** 4-digit PIN revealed to the collector only after physical weighing is complete.
* **Post-Transaction ESG Impact Slip:** Receipt displaying Boragaon dumpsite volume saved, carbon avoided, and green KC credits.

### 1.2 `/apps/partner` (Low-Resource Android-ONLY Collector APK)
* **Zero-Text High-Contrast Semantic UI:** 64x64px touch targets (#059669 Green, #DC2626 Red, #D97706 Amber, #1D4ED8 Blue).
* **Colloquial Assamese Voice Engine (TTS):** Spoken audio prompts in Assamese (`as-IN`) for dispatch, navigation, weighing, and settlement.
* **Hardware BLE Scale Integration:** Bluetooth GATT stream pairing (`0000ffe0-0000-1000-8000-00805f9b34fb`) with hard-disabled manual text inputs.
* **Doorstep OTP Verification Keypad:** 4-digit PIN verification triggering instant UPI payout rails.
* **Offline SQLite Transaction Queue:** Local cryptographic buffering during cellular network drops in low-connectivity lanes.
* **Persistent Sahaayak SOS Component:** 3-second continuous press emergency dispatch button connecting to Guwahati Ops Desk.

### 1.3 `/apps/admin` (Desktop Operations Console)
* **Live PostGIS Dispatch Radar:** Geospatial radar tracking active collectors across Beltola, Jayanagar, Ganeshguri, Noonmati, and Hatigaon.
* **Monsoon Ward Suspension Desk:** 1-click ward toggle to freeze logistics in waterlogged wards and automate customer SMS rescheduling.
* **Dynamic Floor Rate Card Manager:** Real-time pricing formula calculator with regional Guwahati logistics freight offsets (Byrnihat ₹1.20, Siliguri ₹3.50).
* **Collector Float Ledger Desk:** Real-time monitor enforcing ₹2,000 minimum pre-funded float balance threshold and append-only audit trail.
* **Visual Dispute Resolution Queue:** Side-by-side photographic review for 1-tap admin arbitration.
* **SWM Rules 2026 Compliance Engine:** Municipal waste stream auditing, landfill diversion metrics, and EPR credit issuance.
