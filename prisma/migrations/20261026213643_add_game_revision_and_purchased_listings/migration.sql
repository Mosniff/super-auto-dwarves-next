-- AlterTable
ALTER TABLE "Game" ADD COLUMN     "purchasedShopListingIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "revision" INTEGER NOT NULL DEFAULT 0;
