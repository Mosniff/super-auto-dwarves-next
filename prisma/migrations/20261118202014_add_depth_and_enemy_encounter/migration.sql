-- AlterTable
ALTER TABLE "Game" ADD COLUMN     "depth" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "enemyEncounter" JSONB;
