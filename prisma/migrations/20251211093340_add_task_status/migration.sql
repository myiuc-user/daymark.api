/*
  Warnings:

  - You are about to drop the column `active` on the `Sprint` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "SprintStatus" AS ENUM ('PLANNED', 'ACTIVE', 'COMPLETED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TaskStatus" ADD VALUE 'IN_REVIEW';
ALTER TYPE "TaskStatus" ADD VALUE 'VALIDATED';
ALTER TYPE "TaskStatus" ADD VALUE 'CANCELLED';

-- AlterTable
ALTER TABLE "Sprint" DROP COLUMN "active",
ADD COLUMN     "status" "SprintStatus" NOT NULL DEFAULT 'PLANNED';
