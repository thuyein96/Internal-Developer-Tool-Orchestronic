-- CreateEnum
CREATE TYPE "public"."RepositoryStatus" AS ENUM ('Created', 'Pending');

-- CreateEnum
CREATE TYPE "public"."CloudProvider" AS ENUM ('AWS', 'AZURE');

-- CreateEnum
CREATE TYPE "public"."Status" AS ENUM ('Pending', 'Approved', 'Rejected');

-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('Admin', 'IT', 'Developer');

-- CreateEnum
CREATE TYPE "public"."Engine" AS ENUM ('MySQL', 'PostgreSQL');

-- CreateTable
CREATE TABLE "public"."Request" (
    "id" TEXT NOT NULL,
    "status" "public"."Status" NOT NULL DEFAULT 'Pending',
    "description" TEXT NOT NULL,
    "resourcesId" TEXT NOT NULL,
    "repositoryId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "displayCode" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "feedback" TEXT,

    CONSTRAINT "Request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Repository" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "resourcesId" TEXT NOT NULL,
    "status" "public"."RepositoryStatus" NOT NULL DEFAULT 'Pending',

    CONSTRAINT "Repository_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Resources" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cloudProvider" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "resourceConfigId" TEXT NOT NULL,

    CONSTRAINT "Resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ResourceConfig" (
    "id" TEXT NOT NULL,

    CONSTRAINT "ResourceConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VMInstance" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "os" TEXT NOT NULL,
    "resourceConfigId" TEXT NOT NULL,
    "sizeId" TEXT NOT NULL,

    CONSTRAINT "VMInstance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DatabaseInstance" (
    "id" TEXT NOT NULL,
    "storageGB" INTEGER NOT NULL DEFAULT 32768,
    "resourceConfigId" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'database-instance',
    "password" TEXT NOT NULL DEFAULT 'P@ssw0rd!',
    "skuName" TEXT NOT NULL DEFAULT 'B_Standard_B1ms',
    "username" TEXT NOT NULL DEFAULT 'orchestronic_user',
    "engine" "public"."Engine" NOT NULL DEFAULT 'PostgreSQL',

    CONSTRAINT "DatabaseInstance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."StorageInstance" (
    "id" TEXT NOT NULL,
    "resourceConfigId" TEXT NOT NULL,
    "accessTier" TEXT NOT NULL DEFAULT 'Hot',
    "kind" TEXT NOT NULL DEFAULT 'StorageV2',
    "name" TEXT NOT NULL DEFAULT 'storage-instance',
    "sku" TEXT NOT NULL DEFAULT 'Standard_LRS',

    CONSTRAINT "StorageInstance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "public"."Role" NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ownedRepository" (
    "userId" TEXT NOT NULL,
    "repositoryId" TEXT NOT NULL,

    CONSTRAINT "ownedRepository_pkey" PRIMARY KEY ("userId","repositoryId")
);

-- CreateTable
CREATE TABLE "public"."RepositoryCollaborators" (
    "userId" TEXT NOT NULL,
    "repositoryId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RepositoryCollaborators_pkey" PRIMARY KEY ("userId","repositoryId")
);

-- CreateTable
CREATE TABLE "public"."RefreshToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CloudResourceSecret" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "clientSecret" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "tenantId" TEXT,
    "cloudProvider" "public"."CloudProvider" NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "CloudResourceSecret_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AzureVMSize" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "numberOfCores" INTEGER NOT NULL,
    "maxDataDiskCount" INTEGER NOT NULL,
    "memoryInMB" INTEGER NOT NULL,
    "osDiskSizeInMB" INTEGER NOT NULL,
    "resourceDiskSizeInMB" INTEGER NOT NULL,

    CONSTRAINT "AzureVMSize_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PolicyVM" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "memoryInMB" INTEGER NOT NULL,
    "numberOfCores" INTEGER NOT NULL,
    "cloudProvider" "public"."CloudProvider" NOT NULL,

    CONSTRAINT "PolicyVM_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PolicyDatabase" (
    "id" TEXT NOT NULL,
    "maxStorage" INTEGER NOT NULL,
    "cloudProvider" "public"."CloudProvider" NOT NULL,

    CONSTRAINT "PolicyDatabase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PolicyStorage" (
    "id" TEXT NOT NULL,
    "maxStorage" INTEGER NOT NULL,
    "cloudProvider" "public"."CloudProvider" NOT NULL,

    CONSTRAINT "PolicyStorage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."_RepositoryCollaborators" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_RepositoryCollaborators_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Request_resourcesId_key" ON "public"."Request"("resourcesId");

-- CreateIndex
CREATE UNIQUE INDEX "Request_repositoryId_key" ON "public"."Request"("repositoryId");

-- CreateIndex
CREATE UNIQUE INDEX "Request_displayCode_key" ON "public"."Request"("displayCode");

-- CreateIndex
CREATE UNIQUE INDEX "Repository_name_key" ON "public"."Repository"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Repository_resourcesId_key" ON "public"."Repository"("resourcesId");

-- CreateIndex
CREATE UNIQUE INDEX "Resources_resourceConfigId_key" ON "public"."Resources"("resourceConfigId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_token_key" ON "public"."RefreshToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "CloudResourceSecret_clientId_key" ON "public"."CloudResourceSecret"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "CloudResourceSecret_subscriptionId_key" ON "public"."CloudResourceSecret"("subscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "AzureVMSize_name_key" ON "public"."AzureVMSize"("name");

-- CreateIndex
CREATE UNIQUE INDEX "PolicyVM_cloudProvider_key" ON "public"."PolicyVM"("cloudProvider");

-- CreateIndex
CREATE UNIQUE INDEX "PolicyDatabase_cloudProvider_key" ON "public"."PolicyDatabase"("cloudProvider");

-- CreateIndex
CREATE UNIQUE INDEX "PolicyStorage_cloudProvider_key" ON "public"."PolicyStorage"("cloudProvider");

-- CreateIndex
CREATE INDEX "_RepositoryCollaborators_B_index" ON "public"."_RepositoryCollaborators"("B");

-- AddForeignKey
ALTER TABLE "public"."Request" ADD CONSTRAINT "Request_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Request" ADD CONSTRAINT "Request_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "public"."Repository"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Request" ADD CONSTRAINT "Request_resourcesId_fkey" FOREIGN KEY ("resourcesId") REFERENCES "public"."Resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Repository" ADD CONSTRAINT "Repository_resourcesId_fkey" FOREIGN KEY ("resourcesId") REFERENCES "public"."Resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Resources" ADD CONSTRAINT "Resources_resourceConfigId_fkey" FOREIGN KEY ("resourceConfigId") REFERENCES "public"."ResourceConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VMInstance" ADD CONSTRAINT "VMInstance_resourceConfigId_fkey" FOREIGN KEY ("resourceConfigId") REFERENCES "public"."ResourceConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VMInstance" ADD CONSTRAINT "VMInstance_sizeId_fkey" FOREIGN KEY ("sizeId") REFERENCES "public"."AzureVMSize"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DatabaseInstance" ADD CONSTRAINT "DatabaseInstance_resourceConfigId_fkey" FOREIGN KEY ("resourceConfigId") REFERENCES "public"."ResourceConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StorageInstance" ADD CONSTRAINT "StorageInstance_resourceConfigId_fkey" FOREIGN KEY ("resourceConfigId") REFERENCES "public"."ResourceConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ownedRepository" ADD CONSTRAINT "ownedRepository_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "public"."Repository"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ownedRepository" ADD CONSTRAINT "ownedRepository_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RepositoryCollaborators" ADD CONSTRAINT "RepositoryCollaborators_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "public"."Repository"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RepositoryCollaborators" ADD CONSTRAINT "RepositoryCollaborators_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CloudResourceSecret" ADD CONSTRAINT "CloudResourceSecret_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_RepositoryCollaborators" ADD CONSTRAINT "_RepositoryCollaborators_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Repository"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_RepositoryCollaborators" ADD CONSTRAINT "_RepositoryCollaborators_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
