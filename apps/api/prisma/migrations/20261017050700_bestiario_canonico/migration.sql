-- AlterTable
ALTER TABLE "especie" ADD COLUMN     "elemento" TEXT NOT NULL DEFAULT 'fisico',
ADD COLUMN     "es_legendaria" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "movimiento" ADD COLUMN     "efecto" TEXT,
ADD COLUMN     "slot" INTEGER NOT NULL DEFAULT 1;

-- CreateIndex
CREATE UNIQUE INDEX "movimiento_especie_id_slot_key" ON "movimiento"("especie_id", "slot");
