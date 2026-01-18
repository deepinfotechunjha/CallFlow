-- CreateTable
CREATE TABLE "ServiceDeletionHistory" (
    "id" SERIAL NOT NULL,
    "deletedBy" INTEGER NOT NULL,
    "deletedByName" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "serviceCount" INTEGER NOT NULL,

    CONSTRAINT "ServiceDeletionHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ServiceDeletionHistory_deletedBy_idx" ON "ServiceDeletionHistory"("deletedBy");

-- CreateIndex
CREATE INDEX "ServiceDeletionHistory_deletedAt_idx" ON "ServiceDeletionHistory"("deletedAt");

-- AddForeignKey
ALTER TABLE "ServiceDeletionHistory" ADD CONSTRAINT "ServiceDeletionHistory_deletedBy_fkey" FOREIGN KEY ("deletedBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;