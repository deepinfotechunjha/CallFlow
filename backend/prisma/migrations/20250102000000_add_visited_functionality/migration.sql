-- Add visited functionality fields to Call table
ALTER TABLE "Call" ADD COLUMN "visitedRemark" TEXT;
ALTER TABLE "Call" ADD COLUMN "visitedBy" TEXT;
ALTER TABLE "Call" ADD COLUMN "visitedAt" TIMESTAMP(3);

-- Update status enum to include VISITED
-- Note: This will be handled by Prisma's enum update mechanism