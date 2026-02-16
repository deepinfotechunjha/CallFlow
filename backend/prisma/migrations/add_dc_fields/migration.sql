-- Add DC fields to Call table
ALTER TABLE "Call" ADD COLUMN "dcRequired" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Call" ADD COLUMN "dcRemark" TEXT;
ALTER TABLE "Call" ADD COLUMN "dcStatus" TEXT;
ALTER TABLE "Call" ADD COLUMN "dcCompletedBy" TEXT;
ALTER TABLE "Call" ADD COLUMN "dcCompletedAt" TIMESTAMP(3);

-- Create index for DC queries
CREATE INDEX "Call_dcRequired_dcStatus_idx" ON "Call"("dcRequired", "dcStatus");
