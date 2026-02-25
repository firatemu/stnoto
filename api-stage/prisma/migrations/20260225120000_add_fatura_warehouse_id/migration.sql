-- AlterTable
ALTER TABLE "faturalar" ADD COLUMN IF NOT EXISTS "warehouseId" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "faturalar_warehouseId_idx" ON "faturalar"("warehouseId");

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'faturalar_warehouseId_fkey'
  ) THEN
    ALTER TABLE "faturalar" ADD CONSTRAINT "faturalar_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
