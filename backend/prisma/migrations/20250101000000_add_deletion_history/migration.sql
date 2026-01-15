-- CreateTable
CREATE TABLE "DeletionHistory" (
    "id" SERIAL NOT NULL,
    "deletedBy" INTEGER NOT NULL,
    "deletedByName" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "callCount" INTEGER NOT NULL,

    CONSTRAINT "DeletionHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DeletionHistory_deletedBy_idx" ON "DeletionHistory"("deletedBy");

-- CreateIndex
CREATE INDEX "DeletionHistory_deletedAt_idx" ON "DeletionHistory"("deletedAt");

-- AddForeignKey
ALTER TABLE "DeletionHistory" ADD CONSTRAINT "DeletionHistory_deletedBy_fkey" FOREIGN KEY ("deletedBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
