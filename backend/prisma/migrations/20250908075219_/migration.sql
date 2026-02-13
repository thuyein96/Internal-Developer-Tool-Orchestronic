/*
  Warnings:

  - You are about to drop the column `dbInstanceClass` on the `AwsDatabaseInstance` table. All the data in the column will be lost.
  - Added the required column `awsDatabaseTypeId` to the `AwsDatabaseInstance` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."AwsDatabaseInstance" DROP COLUMN "dbInstanceClass",
ADD COLUMN     "awsDatabaseTypeId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."AwsDatabaseInstance" ADD CONSTRAINT "AwsDatabaseInstance_awsDatabaseTypeId_fkey" FOREIGN KEY ("awsDatabaseTypeId") REFERENCES "public"."AwsDatabaseType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
