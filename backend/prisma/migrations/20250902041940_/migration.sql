/*
  Warnings:

  - Added the required column `core` to the `AwsInstanceType` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ram` to the `AwsInstanceType` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."AwsInstanceType" ADD COLUMN     "core" INTEGER NOT NULL,
ADD COLUMN     "ram" INTEGER NOT NULL;
