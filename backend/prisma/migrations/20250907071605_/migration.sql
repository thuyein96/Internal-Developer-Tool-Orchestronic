/*
  Warnings:

  - You are about to drop the column `name` on the `AwsVMInstance` table. All the data in the column will be lost.
  - Added the required column `instanceName` to the `AwsVMInstance` table without a default value. This is not possible if the table is not empty.
  - Added the required column `keyName` to the `AwsVMInstance` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sgName` to the `AwsVMInstance` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."AwsVMInstance" DROP COLUMN "name",
ADD COLUMN     "instanceName" TEXT NOT NULL,
ADD COLUMN     "keyName" TEXT NOT NULL,
ADD COLUMN     "sgName" TEXT NOT NULL;
