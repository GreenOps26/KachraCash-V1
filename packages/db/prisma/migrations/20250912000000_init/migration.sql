-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "postgis";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('CITIZEN', 'COLLECTOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "WalletStatus" AS ENUM ('ACTIVE', 'FROZEN');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('DEBIT', 'CREDIT', 'PENALTY', 'HOLD');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'ASSIGNED', 'EN_ROUTE', 'ARRIVED', 'WEIGHING', 'COMPLETED', 'DISPUTED', 'REASSIGNED', 'CANCELLED');

-- CreateTable
CREATE TABLE "regions" (
    "id" TEXT NOT NULL,
    "wardNumber" INTEGER NOT NULL,
    "wardName" TEXT NOT NULL,
    "geofencePolygon" geometry(Polygon, 4326),
    "isFloodSuspended" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "regions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scrap_categories" (
    "id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "visualTier" TEXT NOT NULL,
    "swmStream" TEXT NOT NULL,
    "description" TEXT,
    "iconUrl" TEXT,

    CONSTRAINT "scrap_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "floor_rate_cards" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "nationalIndexRate" DECIMAL(8,2) NOT NULL,
    "freightOffset" DECIMAL(8,2) NOT NULL,
    "handlingOffset" DECIMAL(8,2) NOT NULL,
    "floorRate" DECIMAL(8,2) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "floor_rate_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "citizens" (
    "id" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "fullName" TEXT,
    "upiVpa" TEXT,
    "kycVerified" BOOLEAN NOT NULL DEFAULT false,
    "regionId" TEXT,
    "coordinates" geometry(Point, 4326),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "citizens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collectors" (
    "id" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "assistedKycToken" TEXT NOT NULL,
    "assignedCartQrId" TEXT NOT NULL,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "coordinates" geometry(Point, 4326),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "collectors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collector_devices" (
    "id" TEXT NOT NULL,
    "collectorId" TEXT NOT NULL,
    "hardwareUuid" TEXT NOT NULL,
    "bleScaleMacAddress" TEXT NOT NULL,
    "lastCalibrationAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "collector_devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collector_wallets" (
    "id" TEXT NOT NULL,
    "collectorId" TEXT NOT NULL,
    "floatBalance" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "lockedAmount" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "minThreshold" DECIMAL(12,2) NOT NULL DEFAULT 2000.00,
    "status" "WalletStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "collector_wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_ledger" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "type" "TransactionType" NOT NULL,
    "description" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "referenceOrderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_ledger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pickup_requests" (
    "id" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "regionId" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "visualTier" TEXT NOT NULL,
    "scheduledSlotStart" TIMESTAMP(3) NOT NULL,
    "scheduledSlotEnd" TIMESTAMP(3) NOT NULL,
    "pickupLocation" geometry(Point, 4326),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pickup_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pickup_assignments" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "collectorId" TEXT NOT NULL,
    "matchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "proximityMeters" DOUBLE PRECISION NOT NULL,
    "slaStatus" TEXT NOT NULL,

    CONSTRAINT "pickup_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "otpHash" TEXT NOT NULL,
    "grossAmount" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "platformFee" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "netPayout" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction_items" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "weightKg" DECIMAL(8,3) NOT NULL,
    "unitRate" DECIMAL(8,2) NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "scaleHardwareId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transaction_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payouts" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "gatewayRef" TEXT,
    "upiVpa" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "status" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ratings" (
    "id" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "collectorId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "feedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ratings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "entityName" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "performedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "regions_wardNumber_key" ON "regions"("wardNumber");

-- CreateIndex
CREATE INDEX "regions_geofencePolygon_idx" ON "regions" USING GIST ("geofencePolygon");

-- CreateIndex
CREATE UNIQUE INDEX "scrap_categories_sku_key" ON "scrap_categories"("sku");

-- CreateIndex
CREATE INDEX "floor_rate_cards_categoryId_version_idx" ON "floor_rate_cards"("categoryId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "citizens_phoneNumber_key" ON "citizens"("phoneNumber");

-- CreateIndex
CREATE INDEX "citizens_coordinates_idx" ON "citizens" USING GIST ("coordinates");

-- CreateIndex
CREATE UNIQUE INDEX "collectors_phoneNumber_key" ON "collectors"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "collectors_assistedKycToken_key" ON "collectors"("assistedKycToken");

-- CreateIndex
CREATE UNIQUE INDEX "collectors_assignedCartQrId_key" ON "collectors"("assignedCartQrId");

-- CreateIndex
CREATE INDEX "collectors_coordinates_idx" ON "collectors" USING GIST ("coordinates");

-- CreateIndex
CREATE UNIQUE INDEX "collector_devices_hardwareUuid_key" ON "collector_devices"("hardwareUuid");

-- CreateIndex
CREATE UNIQUE INDEX "collector_wallets_collectorId_key" ON "collector_wallets"("collectorId");

-- CreateIndex
CREATE UNIQUE INDEX "wallet_ledger_idempotencyKey_key" ON "wallet_ledger"("idempotencyKey");

-- CreateIndex
CREATE INDEX "wallet_ledger_walletId_idx" ON "wallet_ledger"("walletId");

-- CreateIndex
CREATE INDEX "pickup_requests_pickupLocation_idx" ON "pickup_requests" USING GIST ("pickupLocation");

-- CreateIndex
CREATE INDEX "pickup_requests_status_scheduledSlotStart_idx" ON "pickup_requests"("status", "scheduledSlotStart");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_requestId_key" ON "transactions"("requestId");

-- CreateIndex
CREATE UNIQUE INDEX "payouts_transactionId_key" ON "payouts"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "payouts_gatewayRef_key" ON "payouts"("gatewayRef");

-- CreateIndex
CREATE UNIQUE INDEX "payouts_idempotencyKey_key" ON "payouts"("idempotencyKey");

-- AddForeignKey
ALTER TABLE "floor_rate_cards" ADD CONSTRAINT "floor_rate_cards_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "scrap_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citizens" ADD CONSTRAINT "citizens_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "regions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collector_devices" ADD CONSTRAINT "collector_devices_collectorId_fkey" FOREIGN KEY ("collectorId") REFERENCES "collectors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collector_wallets" ADD CONSTRAINT "collector_wallets_collectorId_fkey" FOREIGN KEY ("collectorId") REFERENCES "collectors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_ledger" ADD CONSTRAINT "wallet_ledger_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "collector_wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pickup_requests" ADD CONSTRAINT "pickup_requests_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pickup_requests" ADD CONSTRAINT "pickup_requests_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "regions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pickup_assignments" ADD CONSTRAINT "pickup_assignments_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "pickup_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pickup_assignments" ADD CONSTRAINT "pickup_assignments_collectorId_fkey" FOREIGN KEY ("collectorId") REFERENCES "collectors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "pickup_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_items" ADD CONSTRAINT "transaction_items_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_items" ADD CONSTRAINT "transaction_items_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "scrap_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_collectorId_fkey" FOREIGN KEY ("collectorId") REFERENCES "collectors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

