/*
  Warnings:

  - Added the required column `customerName` to the `Call` table without a default value. This is not possible if the table is not empty.
  - Added the required column `phone` to the `Call` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Call" DROP CONSTRAINT "Call_customerId_fkey";

-- DropIndex
DROP INDEX "Call_customerId_idx";

-- AlterTable
ALTER TABLE "Call" ADD COLUMN     "address" TEXT,
ADD COLUMN     "customerName" TEXT NOT NULL,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "phone" TEXT NOT NULL,
ALTER COLUMN "customerId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;

-- AddForeignKey
ALTER TABLE "Call" ADD CONSTRAINT "Call_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
