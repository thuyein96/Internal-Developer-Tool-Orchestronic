/*
  Warnings:

  - You are about to drop the column `clusterSizeId` on the `AzureVMInstance` table. All the data in the column will be lost.
  - You are about to drop the `AzureClusterSize` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `AzurePolicyCluster` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."AzureVMInstance" DROP CONSTRAINT "AzureVMInstance_clusterSizeId_fkey";

-- AlterTable
ALTER TABLE "public"."AzureVMInstance" DROP COLUMN "clusterSizeId";

-- DropTable
DROP TABLE "public"."AzureClusterSize";

-- DropTable
DROP TABLE "public"."AzurePolicyCluster";
