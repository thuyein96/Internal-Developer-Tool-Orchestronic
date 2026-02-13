/*
  Warnings:

  - You are about to drop the `PolicyDatabase` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PolicyStorage` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PolicyVM` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "public"."PolicyDatabase";

-- DropTable
DROP TABLE "public"."PolicyStorage";

-- DropTable
DROP TABLE "public"."PolicyVM";

-- CreateTable
CREATE TABLE "public"."AzurePolicyVM" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "memoryInMB" INTEGER NOT NULL,
    "numberOfCores" INTEGER NOT NULL,

    CONSTRAINT "AzurePolicyVM_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AzurePolicyDatabase" (
    "id" TEXT NOT NULL,
    "maxStorage" INTEGER NOT NULL,

    CONSTRAINT "AzurePolicyDatabase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AzurePolicyStorage" (
    "id" TEXT NOT NULL,
    "maxStorage" INTEGER NOT NULL,

    CONSTRAINT "AzurePolicyStorage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AwsPolicyVM" (
    "id" TEXT NOT NULL,

    CONSTRAINT "AwsPolicyVM_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AwsPolicyDatabase" (
    "id" TEXT NOT NULL,

    CONSTRAINT "AwsPolicyDatabase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AwsPolicyStorage" (
    "id" TEXT NOT NULL,

    CONSTRAINT "AwsPolicyStorage_pkey" PRIMARY KEY ("id")
);
