/*
  Warnings:

  - You are about to drop the `RefreshToken` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."RefreshToken" DROP CONSTRAINT "RefreshToken_userId_fkey";

-- DropTable
DROP TABLE "public"."RefreshToken";

-- CreateTable
CREATE TABLE "public"."AzureVMInstance" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "os" TEXT NOT NULL,
    "resourceConfigId" TEXT NOT NULL,

    CONSTRAINT "AzureVMInstance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AwsVMInstance" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "os" TEXT NOT NULL,
    "resourceConfigId" TEXT NOT NULL,
    "awsInstanceTypeId" TEXT NOT NULL,

    CONSTRAINT "AwsVMInstance_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."AzureVMInstance" ADD CONSTRAINT "AzureVMInstance_resourceConfigId_fkey" FOREIGN KEY ("resourceConfigId") REFERENCES "public"."ResourceConfig"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AwsVMInstance" ADD CONSTRAINT "AwsVMInstance_awsInstanceTypeId_fkey" FOREIGN KEY ("awsInstanceTypeId") REFERENCES "public"."AwsInstanceType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
