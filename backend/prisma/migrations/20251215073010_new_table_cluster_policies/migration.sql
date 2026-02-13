-- CreateTable
CREATE TABLE "public"."AzurePolicyCluster" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "memoryInMB" INTEGER NOT NULL,
    "numberOfCores" INTEGER NOT NULL,

    CONSTRAINT "AzurePolicyCluster_pkey" PRIMARY KEY ("id")
);
