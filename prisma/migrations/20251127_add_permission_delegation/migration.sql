-- CreateTable PermissionDelegation
CREATE TABLE "PermissionDelegation" (
    "id" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "workspaceId" TEXT,
    "projectId" TEXT,
    "permissions" TEXT[],
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PermissionDelegation_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PermissionDelegation" ADD CONSTRAINT "PermissionDelegation_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PermissionDelegation" ADD CONSTRAINT "PermissionDelegation_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
