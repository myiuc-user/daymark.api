-- AlterTable
ALTER TABLE "User" ADD COLUMN "twoFactorRecoveryToken" TEXT,
ADD COLUMN "twoFactorRecoveryTokenExpiry" TIMESTAMP(3);
