# System Architecture Blueprint: KachraCash (`কচৰা ক্যাশ`)

> **Document Status:** Authoritative System Blueprint  
> **Target Audience:** Principal Architects, Backend Engineers, DevOps, Lead Developers  
> **Repository:** KachraCash Monorepo  
> **Version:** 1.1.0

---

## 1. Monorepo Directory Architecture & Build Pipelines

KachraCash is architected as a high-performance monorepo managed via **pnpm Workspaces** and **Turborepo**. The codebase enforces strict layer isolation, preventing client applications from directly coupling with database layer ORMs or internal drivers.

### 1.1 Structural Layout Tree

```
kachracash/
├── apps/
│   ├── citizen/                  # Cross-platform React Native / Expo mobile app (iOS & Android)
│   ├── partner/                  # Android-ONLY React Native / Expo collector APK (Android Go)
│   └── admin/                    # Desktop-ONLY Next.js App Router portal
├── packages/
│   ├── db/                       # Prisma ORM 14-table schema, migrations & Neon pool
│   │   ├── prisma/
│   │   │   └── schema.prisma     # Production PostGIS 14-table schema
│   │   ├── src/                  # DB Client export (`db`)
│   │   └── package.json
│   ├── api/                      # Shared Fastify & tRPC routers, controllers & middleware
│   │   ├── src/
│   │   │   ├── routers/
│   │   │   ├── services/
│   │   │   └── index.ts
│   │   └── package.json
│   └── types/                    # Shared Zod schemas, TypeScript DTOs & BLE contracts
│       ├── src/
│       │   ├── ble.ts            # BLE Telemetry interfaces
│       │   └── index.ts
│       └── package.json
├── docs/                         # System architecture & product docs
├── turbo.json                    # Turborepo task graph pipeline
├── pnpm-workspace.yaml           # pnpm workspace definition
└── package.json                  # Root monorepo dependencies
```

### 1.2 Monorepo Task Graph (`turbo.json`)

```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "typecheck": {
      "dependsOn": ["^build"]
    },
    "lint": {
      "outputs": []
    },
    "db:generate": {
      "cache": false
    },
    "db:migrate": {
      "cache": false
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"]
    }
  }
}
```

---

## 2. Complete 14-Table Relational Schema (PostgreSQL / Neon)

The database layer targets **PostgreSQL 16 on Neon** with the **PostGIS** extension enabled (`CREATE EXTENSION IF NOT EXISTS postgis;`). Schema definitions reside in [`/packages/db/prisma/schema.prisma`](file:///home/sumeet/Documents/kachracash/packages/db/prisma/schema.prisma).

### 2.1 Complete 14-Table Prisma Schema

```prisma
datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  directUrl  = env("DATABASE_URL_UNPOOLED")
  extensions = [postgis]
}

generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}

enum Role {
  CITIZEN
  COLLECTOR
  ADMIN
}

enum WalletStatus {
  ACTIVE
  FROZEN
}

enum TransactionType {
  DEBIT
  CREDIT
  PENALTY
  HOLD
}

enum OrderStatus {
  PENDING
  ASSIGNED
  EN_ROUTE
  ARRIVED
  WEIGHING
  COMPLETED
  DISPUTED
  REASSIGNED
  CANCELLED
}

// 1. REGIONS (Guwahati Municipal Wards & Flood Suspensions)
model Region {
  id               String   @id @default(uuid())
  wardNumber       Int      @unique
  wardName         String   // e.g. "Beltola", "Jayanagar", "Hatigaon"
  geofencePolygon  Unsupported("geometry(Polygon, 4326)")
  isFloodSuspended Boolean  @default(false)
  updatedAt        DateTime @updatedAt

  citizens         Citizen[]
  pickupRequests   PickupRequest[]

  @@index([geofencePolygon], type: Gist)
  @@map("regions")
}

// 2. SCRAP CATEGORIES (2-Layer Mapping: UI Visual Tier to 8 Granular SKUs & 4 SWM Streams)
model ScrapCategory {
  id            String   @id @default(uuid())
  sku           String   @unique // e.g. "PET_RIGID", "HDPE_RIGID", "CARDBOARD"
  name          String
  visualTier    String   // "RIGID_CONTAINERS", "SOFT_FILMS", "MIXED_BULKY"
  swmStream     String   // "DRY_RECYCLABLE", "SPECIAL_CARE"
  description   String?
  iconUrl       String?

  floorRates       FloorRateCard[]
  transactionItems TransactionItem[]

  @@map("scrap_categories")
}

// 3. FLOOR RATE CARDS (Versioned Rates & Freight Offsets)
model FloorRateCard {
  id                 String        @id @default(uuid())
  categoryId         String
  category           ScrapCategory @relation(fields: [categoryId], references: [id])
  
  nationalIndexRate  Decimal       @db.Decimal(8, 2)
  freightOffset      Decimal       @db.Decimal(8, 2) // C_freight: ₹1.20 (Byrnihat), ₹3.50 (Siliguri)
  handlingOffset     Decimal       @db.Decimal(8, 2) // C_handling
  floorRate          Decimal       @db.Decimal(8, 2) // Calculated baseline floor price
  version            Int           @default(1)
  
  createdAt          DateTime      @default(now())

  @@index([categoryId, version])
  @@map("floor_rate_cards")
}

// 4. CITIZENS
model Citizen {
  id           String        @id @default(uuid())
  phoneNumber  String        @unique
  fullName     String?
  upiVpa       String?
  kycVerified  Boolean       @default(false)
  regionId     String?
  region       Region?       @relation(fields: [regionId], references: [id])
  
  coordinates  Unsupported("geometry(Point, 4326)")?

  requests     PickupRequest[]
  ratings      Rating[]      @relation("CitizenRatings")

  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt

  @@index([coordinates], type: Gist)
  @@map("citizens")
}

// 5. COLLECTORS
model Collector {
  id                String           @id @default(uuid())
  phoneNumber       String           @unique
  fullName          String
  assistedKycToken  String           @unique
  assignedCartQrId  String           @unique
  isOnline          Boolean          @default(false)
  
  coordinates       Unsupported("geometry(Point, 4326)")?

  wallet            CollectorWallet?
  devices           CollectorDevice[]
  assignments       PickupAssignment[]
  ratings           Rating[]         @relation("CollectorRatings")

  createdAt         DateTime         @default(now())
  updatedAt         DateTime         @updatedAt

  @@index([coordinates], type: Gist)
  @@map("collectors")
}

// 6. COLLECTOR DEVICES (Hardware BLE Pairing & Calibration)
model CollectorDevice {
  id                 String    @id @default(uuid())
  collectorId        String
  collector          Collector @relation(fields: [collectorId], references: [id], onDelete: Cascade)
  
  hardwareUuid       String    @unique
  bleScaleMacAddress String
  lastCalibrationAt  DateTime  @default(now())

  createdAt          DateTime  @default(now())

  @@map("collector_devices")
}

// 7. COLLECTOR WALLETS (Pre-Funded Float Balance & Locked Escrow Reserve)
model CollectorWallet {
  id           String         @id @default(uuid())
  collectorId  String         @unique
  collector    Collector      @relation(fields: [collectorId], references: [id], onDelete: Cascade)
  
  floatBalance Decimal        @default(0.00) @db.Decimal(12, 2)
  lockedAmount Decimal        @default(0.00) @db.Decimal(12, 2)
  minThreshold Decimal        @default(2000.00) @db.Decimal(12, 2)
  status       WalletStatus   @default(ACTIVE)

  ledgerEntries WalletLedger[]

  createdAt    DateTime       @default(now())
  updatedAt    DateTime       @updatedAt

  @@map("collector_wallets")
}

// 8. WALLET LEDGER (Append-Only Immutable Financial Ledger)
model WalletLedger {
  id             String          @id @default(uuid())
  walletId       String
  wallet         CollectorWallet @relation(fields: [walletId], references: [id], onDelete: Cascade)
  
  amount         Decimal         @db.Decimal(12, 2)
  type           TransactionType
  description    String
  idempotencyKey String          @unique
  referenceOrderId String?

  createdAt      DateTime        @default(now())

  @@index([walletId])
  @@map("wallet_ledger")
}

// 9. PICKUP REQUESTS
model PickupRequest {
  id                 String        @id @default(uuid())
  citizenId          String
  citizen            Citizen       @relation(fields: [citizenId], references: [id])
  regionId           String
  region             Region        @relation(fields: [regionId], references: [id])

  status             OrderStatus   @default(PENDING)
  visualTier         String        // "RIGID_CONTAINERS", "SOFT_FILMS", "MIXED_BULKY"
  scheduledSlotStart DateTime
  scheduledSlotEnd   DateTime
  
  pickupLocation     Unsupported("geometry(Point, 4326)")

  assignments        PickupAssignment[]
  transaction        Transaction?

  createdAt          DateTime      @default(now())
  updatedAt          DateTime      @updatedAt

  @@index([pickupLocation], type: Gist)
  @@index([status, scheduledSlotStart])
  @@map("pickup_requests")
}

// 10. PICKUP ASSIGNMENTS (SLA Matching & Proximity Audits)
model PickupAssignment {
  id              String        @id @default(uuid())
  requestId       String
  request         PickupRequest @relation(fields: [requestId], references: [id], onDelete: Cascade)
  collectorId     String
  collector       Collector     @relation(fields: [collectorId], references: [id])

  matchedAt       DateTime      @default(now())
  proximityMeters Float
  slaStatus       String        // "MET", "BREACHED_REASSIGNED"

  @@map("pickup_assignments")
}

// 11. TRANSACTIONS (Doorstep Execution & OTP Hash)
model Transaction {
  id               String        @id @default(uuid())
  requestId        String        @unique
  request          PickupRequest @relation(fields: [requestId], references: [id])

  otpHash          String
  grossAmount      Decimal       @default(0.00) @db.Decimal(12, 2)
  platformFee      Decimal       @default(0.00) @db.Decimal(12, 2)
  netPayout        Decimal       @default(0.00) @db.Decimal(12, 2)
  
  completedAt      DateTime?

  items            TransactionItem[]
  payout           Payout?

  createdAt        DateTime      @default(now())

  @@map("transactions")
}

// 12. TRANSACTION ITEMS (BLE-Verified Scrap Line Items)
model TransactionItem {
  id            String        @id @default(uuid())
  transactionId String
  transaction   Transaction   @relation(fields: [transactionId], references: [id], onDelete: Cascade)
  categoryId    String
  category      ScrapCategory @relation(fields: [categoryId], references: [id])

  weightKg      Decimal       @db.Decimal(8, 3)
  unitRate      Decimal       @db.Decimal(8, 2)
  subtotal      Decimal       @db.Decimal(10, 2)
  scaleHardwareId String

  createdAt     DateTime      @default(now())

  @@map("transaction_items")
}

// 13. PAYOUTS (Cashfree / RazorpayX Payout Rails)
model Payout {
  id               String      @id @default(uuid())
  transactionId    String      @unique
  transaction      Transaction @relation(fields: [transactionId], references: [id])

  gatewayRef       String?     @unique
  upiVpa           String
  amount           Decimal     @db.Decimal(12, 2)
  status           String      // "INITIATED", "SUCCESS", "FAILED"
  idempotencyKey   String      @unique

  createdAt        DateTime    @default(now())

  @@map("payouts")
}

// 14. RATINGS & AUDIT LOG
model Rating {
  id           String     @id @default(uuid())
  citizenId    String
  citizen      Citizen    @relation("CitizenRatings", fields: [citizenId], references: [id])
  collectorId  String
  collector    Collector  @relation("CollectorRatings", fields: [collectorId], references: [id])
  score        Int        // 1 to 5
  feedback     String?

  createdAt    DateTime   @default(now())

  @@map("ratings")
}

model AuditLog {
  id           String   @id @default(uuid())
  entityName   String
  entityId     String
  action       String   // "CREATE", "UPDATE", "SUSPEND_WARD"
  payload      Json
  performedBy  String

  createdAt    DateTime @default(now())

  @@map("audit_logs")
}
```

---

## 3. Geospatial & SLA Dispatch Engine (PostGIS)

```
┌────────────────────────────────────────────────────────────────────────┐
│                        DISPATCH SLA TIMELINE                          │
│                                                                        │
│  T-45 min: Job Scheduled ──> T-15 min: Proximity Check (500m geofence) │
│                                             │                          │
│                    ┌────────────────────────┴───────────────────────┐  │
│                    ▼                                                ▼  │
│            Collector Within 500m                           Collector Outside 500m
│            (Maintain Assignment)                           (Auto-Reassign + ₹150 Penalty)
└────────────────────────────────────────────────────────────────────────┘
```

### 3.1 500-Meter Proximity Verification SQL ($T-15\text{ minutes}$)

```sql
-- Query to identify non-compliant collectors static or >500m away at T-15 minutes
SELECT 
    pr.id AS request_id,
    pa.collector_id,
    ST_DistanceSphere(
        pr.pickup_location, 
        c.coordinates
    ) AS distance_meters
FROM pickup_requests pr
JOIN pickup_assignments pa ON pr.id = pa.request_id
JOIN collectors c ON pa.collector_id = c.id
WHERE pr.status = 'ASSIGNED'
  AND pr.scheduled_slot_start <= NOW() + INTERVAL '15 minutes'
  AND (
      c.coordinates IS NULL 
      OR ST_DistanceSphere(pr.pickup_location, c.coordinates) > 500
  );
```

---

## 4. Financial Settlement & Key API Endpoints

### 4.1 Doorstep Payout Handshake Sequence

```mermaid
sequenceDiagram
    autonumber
    actor Citizen
    actor Collector
    participant PartnerApp as /apps/partner
    participant API as /packages/api
    participant DB as Neon Postgres DB
    participant PG as Cashfree/RazorpayX

    Collector->>PartnerApp: Input 4-Digit Customer OTP
    PartnerApp->>API: POST /api/v1/orders/complete (requestId, otp, bleItems)
    API->>API: Verify bcrypt(otp) against transaction.otpHash
    
    rect rgb(240, 248, 255)
        Note over API,DB: Atomic Database Transaction ($transaction)
        API->>DB: Lock collector wallet balance
        API->>DB: Calculate Payout (92% Net to Citizen, 8% Platform Fee)
        API->>DB: Debit Collector Wallet (Gross Amount)
        API->>DB: Record WalletLedger entry & set status = COMPLETED
    end

    API->>PG: POST /v1/payouts/transfers (VPA, netPayout, IdempotencyKey)
    PG-->>API: 200 OK (Transfer Initiated)
    API-->>PartnerApp: Settlement Confirmed (Play Assamese Success Audio)
    PG-->>Citizen: Instant UPI Credit Notification
```

### 4.2 Key API Endpoint Contracts

#### 1. Mid-Route Wallet Top-Up (`POST /api/v1/wallets/topup`)
```http
POST /api/v1/wallets/topup HTTP/1.1
Host: api.kachracash.com
Authorization: Bearer {{COLLECTOR_JWT}}
Content-Type: application/json

{
  "amount": 2000.00,
  "paymentGatewayRef": "PAY_UPI_TOPUP_991823",
  "idempotencyKey": "TOPUP_COLL_4410_1725660000"
}
```

#### 2. Monsoon Ward Suspension Toggle (`POST /api/v1/admin/wards/:id/suspend`)
```http
POST /api/v1/admin/wards/WARD_BELTOLA_28/suspend HTTP/1.1
Host: api.kachracash.com
Authorization: Bearer {{ADMIN_JWT}}
Content-Type: application/json

{
  "isFloodSuspended": true,
  "reason": "Severe urban waterlogging on Beltola Survey Bypass Road",
  "triggerCustomerRescheduleSms": true
}
```

---

## 5. Hardware Protocol: BLE Scale GATT Telemetry

### 5.1 GATT Specifications
* **Primary Service UUID:** `0000ffe0-0000-1000-8000-00805f9b34fb`
* **Telemetry Characteristic UUID:** `0000ffe1-0000-1000-8000-00805f9b34fb` (Notify Enabled)
* **Control Characteristic UUID:** `0000ffe2-0000-1000-8000-00805f9b34fb` (Write - Tare Command)

```typescript
// Telemetry Packet Parser implementation (/packages/types/src/ble.ts)
export function parseBLEScalePacket(buffer: Buffer, hardwareSecret: string): BLEWeightTelemetryPacket {
  if (buffer.length < 8 || buffer[0] !== 0xAA) {
    throw new Error("Invalid scale telemetry packet header.");
  }

  const scaleMode = buffer[1];
  const weightGrams = buffer.readUInt16BE(2);
  const batteryPct = buffer[4];
  const isTared = (buffer[5] & 0x01) === 1;
  const receivedSig = buffer.readUInt16BE(6);

  // Validate HMAC signature generated by scale microcontroller
  const expectedSig = computeScaleHMAC(buffer.subarray(0, 6), hardwareSecret);
  if (receivedSig !== expectedSig) {
    throw new Error("BLE Telemetry Signature Mismatch! Hardware payload tampered.");
  }

  return {
    scaleId: `SCALE_${buffer[1].toString(16)}`,
    weightKg: weightGrams / 1000.0,
    isTared,
    batteryPct,
    timestamp: Date.now()
  };
}
```

---

## 6. Infrastructure & Connection Configuration

```bash
# Pooled connection string for runtime API routes (PgBouncer)
DATABASE_URL="postgres://user:pass@ep-cool-lake-123456-pooler.ap-southeast-1.aws.neon.tech/kachracash?sslmode=require&pgbouncer=true"

# Direct unpooled connection string for migrations & DDL
DATABASE_URL_UNPOOLED="postgres://user:pass@ep-cool-lake-123456.ap-southeast-1.aws.neon.tech/kachracash?sslmode=require"
```
