/*
  Warnings:

  - Added the required column `shopSlots` to the `Game` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Game" ADD COLUMN     "shopSlots" JSONB NOT NULL;
