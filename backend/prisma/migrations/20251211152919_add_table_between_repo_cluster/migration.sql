/*
  Warnings:

  - You are about to drop the column `awsK8sClusterId` on the `Repository` table. All the data in the column will be lost.
  - You are about to drop the column `azureK8sClusterId` on the `Repository` table. All the data in the column will be lost.
  - You are about to drop the `ProjectRequest` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[imageDeploymentId]` on the table `Repository` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "public"."ProjectRequest" DROP CONSTRAINT "ProjectRequest_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ProjectRequest" DROP CONSTRAINT "ProjectRequest_repositoryId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ProjectRequest" DROP CONSTRAINT "ProjectRequest_resourcesId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Repository" DROP CONSTRAINT "Repository_awsK8sClusterId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Repository" DROP CONSTRAINT "Repository_azureK8sClusterId_fkey";

-- DropIndex
DROP INDEX "public"."Repository_awsK8sClusterId_key";

-- DropIndex
DROP INDEX "public"."Repository_azureK8sClusterId_key";

-- AlterTable
ALTER TABLE "public"."Repository" DROP COLUMN "awsK8sClusterId",
DROP COLUMN "azureK8sClusterId",
ADD COLUMN     "imageDeploymentId" TEXT;

-- DropTable
DROP TABLE "public"."ProjectRequest";

-- CreateTable
CREATE TABLE "public"."ImageDeployment" (
    "id" TEXT NOT NULL,
    "repositoryId" TEXT NOT NULL,
    "AwsK8sClusterId" TEXT,
    "AzureK8sClusterId" TEXT,
    "imageUrl" TEXT NOT NULL,
    "DeploymentStatus" TEXT NOT NULL DEFAULT 'Pending',

    CONSTRAINT "ImageDeployment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ImageDeployment_repositoryId_key" ON "public"."ImageDeployment"("repositoryId");

-- CreateIndex
CREATE UNIQUE INDEX "Repository_imageDeploymentId_key" ON "public"."Repository"("imageDeploymentId");

-- AddForeignKey
ALTER TABLE "public"."ImageDeployment" ADD CONSTRAINT "ImageDeployment_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "public"."Repository"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ImageDeployment" ADD CONSTRAINT "ImageDeployment_AwsK8sClusterId_fkey" FOREIGN KEY ("AwsK8sClusterId") REFERENCES "public"."AwsK8sCluster"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ImageDeployment" ADD CONSTRAINT "ImageDeployment_AzureK8sClusterId_fkey" FOREIGN KEY ("AzureK8sClusterId") REFERENCES "public"."AzureK8sCluster"("id") ON DELETE SET NULL ON UPDATE CASCADE;
