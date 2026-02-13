/*
  Warnings:

  - You are about to drop the `DatabaseInstance` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `StorageInstance` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `VMInstance` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `sizeId` to the `AzureVMInstance` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `ResourceConfig` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."AzureVMInstance" DROP CONSTRAINT "AzureVMInstance_resourceConfigId_fkey";

-- DropForeignKey
ALTER TABLE "public"."DatabaseInstance" DROP CONSTRAINT "DatabaseInstance_resourceConfigId_fkey";

-- DropForeignKey
ALTER TABLE "public"."StorageInstance" DROP CONSTRAINT "StorageInstance_resourceConfigId_fkey";

-- DropForeignKey
ALTER TABLE "public"."VMInstance" DROP CONSTRAINT "VMInstance_resourceConfigId_fkey";

-- DropForeignKey
ALTER TABLE "public"."VMInstance" DROP CONSTRAINT "VMInstance_sizeId_fkey";

-- AlterTable
ALTER TABLE "public"."AzureVMInstance" ADD COLUMN     "sizeId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."ResourceConfig" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- DropTable
DROP TABLE "public"."DatabaseInstance";

-- DropTable
DROP TABLE "public"."StorageInstance";

-- DropTable
DROP TABLE "public"."VMInstance";

-- CreateTable
CREATE TABLE "public"."AwsDatabaseInstance" (
    "id" TEXT NOT NULL,
    "resourceConfigId" TEXT NOT NULL,

    CONSTRAINT "AwsDatabaseInstance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AwsStorageInstance" (
    "id" TEXT NOT NULL,
    "resourceConfigId" TEXT NOT NULL,

    CONSTRAINT "AwsStorageInstance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AzureDatabaseInstance" (
    "id" TEXT NOT NULL,
    "storageGB" INTEGER NOT NULL DEFAULT 32768,
    "resourceConfigId" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'database-instance',
    "password" TEXT NOT NULL DEFAULT 'P@ssw0rd!',
    "skuName" TEXT NOT NULL DEFAULT 'B_Standard_B1ms',
    "username" TEXT NOT NULL DEFAULT 'orchestronic_user',
    "engine" "public"."Engine" NOT NULL DEFAULT 'PostgreSQL',

    CONSTRAINT "AzureDatabaseInstance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AzureStorageInstance" (
    "id" TEXT NOT NULL,
    "resourceConfigId" TEXT NOT NULL,
    "accessTier" TEXT NOT NULL DEFAULT 'Hot',
    "kind" TEXT NOT NULL DEFAULT 'StorageV2',
    "name" TEXT NOT NULL DEFAULT 'storage-instance',
    "sku" TEXT NOT NULL DEFAULT 'Standard_LRS',

    CONSTRAINT "AzureStorageInstance_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."AwsDatabaseInstance" ADD CONSTRAINT "AwsDatabaseInstance_resourceConfigId_fkey" FOREIGN KEY ("resourceConfigId") REFERENCES "public"."ResourceConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AwsStorageInstance" ADD CONSTRAINT "AwsStorageInstance_resourceConfigId_fkey" FOREIGN KEY ("resourceConfigId") REFERENCES "public"."ResourceConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AzureDatabaseInstance" ADD CONSTRAINT "AzureDatabaseInstance_resourceConfigId_fkey" FOREIGN KEY ("resourceConfigId") REFERENCES "public"."ResourceConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AzureStorageInstance" ADD CONSTRAINT "AzureStorageInstance_resourceConfigId_fkey" FOREIGN KEY ("resourceConfigId") REFERENCES "public"."ResourceConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AzureVMInstance" ADD CONSTRAINT "AzureVMInstance_resourceConfigId_fkey" FOREIGN KEY ("resourceConfigId") REFERENCES "public"."ResourceConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AzureVMInstance" ADD CONSTRAINT "AzureVMInstance_sizeId_fkey" FOREIGN KEY ("sizeId") REFERENCES "public"."AzureVMSize"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AwsVMInstance" ADD CONSTRAINT "AwsVMInstance_resourceConfigId_fkey" FOREIGN KEY ("resourceConfigId") REFERENCES "public"."ResourceConfig"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
