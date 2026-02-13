/*
  Warnings:

  - Added the required column `clusterSizeId` to the `AzureVMInstance` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."AzureVMInstance" ADD COLUMN     "clusterSizeId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "public"."AzureClusterSize" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "numberOfCores" INTEGER NOT NULL,
    "maxDataDiskCount" INTEGER NOT NULL,
    "memoryInMB" INTEGER NOT NULL,
    "osDiskSizeInMB" INTEGER NOT NULL,
    "resourceDiskSizeInMB" INTEGER NOT NULL,

    CONSTRAINT "AzureClusterSize_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AzureClusterSize_name_key" ON "public"."AzureClusterSize"("name");

-- AddForeignKey
ALTER TABLE "public"."AzureVMInstance" ADD CONSTRAINT "AzureVMInstance_clusterSizeId_fkey" FOREIGN KEY ("clusterSizeId") REFERENCES "public"."AzureClusterSize"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
