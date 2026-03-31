-- CreateEnum
CREATE TYPE "BackupUploadSessionStatus" AS ENUM ('PENDING_UPLOAD', 'UPLOADED', 'VALIDATED', 'RESTORE_IN_PROGRESS', 'RESTORED', 'EXPIRED', 'FAILED');

-- CreateTable
CREATE TABLE "BackupUploadSession" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "bucket" TEXT NOT NULL,
    "objectPath" TEXT NOT NULL,
    "status" "BackupUploadSessionStatus" NOT NULL DEFAULT 'PENDING_UPLOAD',
    "maxBytes" INTEGER NOT NULL,
    "fileSizeBytes" INTEGER,
    "fileChecksum" TEXT,
    "taskId" TEXT,
    "lastError" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "uploadedAt" TIMESTAMP(3),
    "validatedAt" TIMESTAMP(3),
    "restoredAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BackupUploadSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BackupUploadSession_bucket_objectPath_key" ON "BackupUploadSession"("bucket", "objectPath");

-- CreateIndex
CREATE INDEX "BackupUploadSession_actorId_status_idx" ON "BackupUploadSession"("actorId", "status");

-- CreateIndex
CREATE INDEX "BackupUploadSession_status_expiresAt_idx" ON "BackupUploadSession"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "BackupUploadSession_expiresAt_idx" ON "BackupUploadSession"("expiresAt");
