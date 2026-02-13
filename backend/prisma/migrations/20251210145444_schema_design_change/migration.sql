/*
  Warnings:

  - You are about to drop the column `aksClusterId` on the `ownedRepository` table. All the data in the column will be lost.
  - You are about to drop the column `eksClusterId` on the `ownedRepository` table. All the data in the column will be lost.
  - You are about to drop the `ClusterRequest` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[azureK8sClusterId]` on the table `Repository` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[awsK8sClusterId]` on the table `Repository` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "public"."ClusterRequest" DROP CONSTRAINT "ClusterRequest_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ClusterRequest" DROP CONSTRAINT "ClusterRequest_repositoryId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ClusterRequest" DROP CONSTRAINT "ClusterRequest_resourcesId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ownedRepository" DROP CONSTRAINT "ownedRepository_aksClusterId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ownedRepository" DROP CONSTRAINT "ownedRepository_eksClusterId_fkey";

-- AlterTable
ALTER TABLE "public"."Repository" ADD COLUMN     "awsK8sClusterId" TEXT,
ADD COLUMN     "azureK8sClusterId" TEXT;

-- AlterTable
ALTER TABLE "public"."ownedRepository" DROP COLUMN "aksClusterId",
DROP COLUMN "eksClusterId";

-- DropTable
DROP TABLE "public"."ClusterRequest";

-- CreateTable
CREATE TABLE "public"."ProjectRequest" (
    "id" TEXT NOT NULL,
    "status" "public"."Status" NOT NULL DEFAULT 'Pending',
    "description" TEXT NOT NULL,
    "repositoryId" TEXT NOT NULL,
    "azureK8sClusterId" TEXT,
    "awsK8sClusterId" TEXT,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "displayCode" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "feedback" TEXT,

    CONSTRAINT "ProjectRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProjectRequest_repositoryId_key" ON "public"."ProjectRequest"("repositoryId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectRequest_azureK8sClusterId_key" ON "public"."ProjectRequest"("azureK8sClusterId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectRequest_awsK8sClusterId_key" ON "public"."ProjectRequest"("awsK8sClusterId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectRequest_displayCode_key" ON "public"."ProjectRequest"("displayCode");

-- CreateIndex
CREATE UNIQUE INDEX "Repository_azureK8sClusterId_key" ON "public"."Repository"("azureK8sClusterId");

-- CreateIndex
CREATE UNIQUE INDEX "Repository_awsK8sClusterId_key" ON "public"."Repository"("awsK8sClusterId");

-- AddForeignKey
ALTER TABLE "public"."ProjectRequest" ADD CONSTRAINT "ProjectRequest_azureK8sClusterId_fkey" FOREIGN KEY ("azureK8sClusterId") REFERENCES "public"."AzureK8sCluster"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProjectRequest" ADD CONSTRAINT "ProjectRequest_awsK8sClusterId_fkey" FOREIGN KEY ("awsK8sClusterId") REFERENCES "public"."AwsK8sCluster"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProjectRequest" ADD CONSTRAINT "ProjectRequest_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProjectRequest" ADD CONSTRAINT "ProjectRequest_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "public"."Repository"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Repository" ADD CONSTRAINT "Repository_azureK8sClusterId_fkey" FOREIGN KEY ("azureK8sClusterId") REFERENCES "public"."AzureK8sCluster"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Repository" ADD CONSTRAINT "Repository_awsK8sClusterId_fkey" FOREIGN KEY ("awsK8sClusterId") REFERENCES "public"."AwsK8sCluster"("id") ON DELETE CASCADE ON UPDATE CASCADE;
