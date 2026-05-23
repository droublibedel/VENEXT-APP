-- Instruction 15A — Shipment foundation (order-linked proxy + future edge).

CREATE TYPE "ShipmentStatus" AS ENUM (
  'PLANNED',
  'LOADING',
  'IN_TRANSIT',
  'DELAYED',
  'DELIVERED',
  'BLOCKED',
  'CANCELLED'
);

CREATE TYPE "ShipmentHealthStatus" AS ENUM (
  'HEALTHY',
  'WATCH',
  'UNSTABLE',
  'CRITICAL',
  'SUSPICIOUS'
);

CREATE TYPE "ShipmentTrackingMode" AS ENUM ('NONE', 'MANUAL', 'EDGE_SYNC', 'GPS_FUTURE');

CREATE TABLE "shipments" (
  "id" UUID NOT NULL,
  "organizationId" UUID NOT NULL,
  "orderId" UUID,
  "relationshipId" UUID,
  "routeCode" TEXT,
  "originTerritory" TEXT NOT NULL,
  "destinationTerritory" TEXT NOT NULL,
  "shipmentStatus" "ShipmentStatus" NOT NULL DEFAULT 'PLANNED',
  "healthStatus" "ShipmentHealthStatus" NOT NULL DEFAULT 'HEALTHY',
  "plannedDepartureAt" TIMESTAMP(3),
  "actualDepartureAt" TIMESTAMP(3),
  "plannedArrivalAt" TIMESTAMP(3),
  "actualArrivalAt" TIMESTAMP(3),
  "carrierLabel" TEXT,
  "vehicleRef" TEXT,
  "trackingMode" "ShipmentTrackingMode" NOT NULL DEFAULT 'NONE',
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "shipments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "shipments_orderId_key" ON "shipments" ("orderId");

CREATE INDEX "shipments_organizationId_shipmentStatus_idx" ON "shipments" ("organizationId", "shipmentStatus");

CREATE INDEX "shipments_organizationId_updatedAt_idx" ON "shipments" ("organizationId", "updatedAt");

ALTER TABLE "shipments"
ADD CONSTRAINT "shipments_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "shipments"
ADD CONSTRAINT "shipments_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "shipments"
ADD CONSTRAINT "shipments_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "relationships" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
