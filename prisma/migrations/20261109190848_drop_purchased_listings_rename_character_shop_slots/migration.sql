/*
  Warnings:

  - You are about to drop the column `purchasedShopListingIds` on the `Game` table. All the data in the column will be lost.
  - You are about to drop the column `shopSlots` on the `Game` table. All the data in the column will be lost.
  - Added the required column `characterShopSlots` to the `Game` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Game" DROP COLUMN "purchasedShopListingIds",
DROP COLUMN "shopSlots",
ADD COLUMN     "characterShopSlots" JSONB NOT NULL;
