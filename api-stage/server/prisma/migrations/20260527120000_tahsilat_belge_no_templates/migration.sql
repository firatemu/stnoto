-- AlterEnum
ALTER TYPE "ModuleType" ADD VALUE IF NOT EXISTS 'TAHSILAT';
ALTER TYPE "ModuleType" ADD VALUE IF NOT EXISTS 'ODEME';
ALTER TYPE "ModuleType" ADD VALUE IF NOT EXISTS 'CAPRAZ_ODEME';

-- AlterTable
ALTER TABLE "tahsilatlar" ADD COLUMN IF NOT EXISTS "belgeNo" TEXT;
ALTER TABLE "tahsilatlar" ADD COLUMN IF NOT EXISTS "caprazBelgeNo" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "tahsilatlar_tenantId_belgeNo_key" ON "tahsilatlar"("tenantId", "belgeNo");
CREATE INDEX IF NOT EXISTS "tahsilatlar_belgeNo_idx" ON "tahsilatlar"("belgeNo");
