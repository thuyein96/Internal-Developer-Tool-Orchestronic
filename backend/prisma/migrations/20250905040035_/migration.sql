/*
  Warnings:

  - Added the required column `maxStorage` to the `AwsPolicyDatabase` table without a default value. This is not possible if the table is not empty.
  - Added the required column `maxStorage` to the `AwsPolicyStorage` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."AwsPolicyDatabase" ADD COLUMN     "maxStorage" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "public"."AwsPolicyStorage" ADD COLUMN     "maxStorage" INTEGER NOT NULL;
