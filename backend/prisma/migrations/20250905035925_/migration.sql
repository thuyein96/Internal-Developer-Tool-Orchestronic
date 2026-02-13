/*
  Warnings:

  - Added the required column `memoryInMB` to the `AwsPolicyVM` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `AwsPolicyVM` table without a default value. This is not possible if the table is not empty.
  - Added the required column `numberOfCores` to the `AwsPolicyVM` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."AwsPolicyVM" ADD COLUMN     "memoryInMB" INTEGER NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "numberOfCores" INTEGER NOT NULL;
