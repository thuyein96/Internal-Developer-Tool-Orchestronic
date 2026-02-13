/*
  Warnings:

  - You are about to drop the column `awsK8sClusterId` on the `ProjectRequest` table. All the data in the column will be lost.
  - You are about to drop the column `azureK8sClusterId` on the `ProjectRequest` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."ProjectRequest" DROP CONSTRAINT "ProjectRequest_awsK8sClusterId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ProjectRequest" DROP CONSTRAINT "ProjectRequest_azureK8sClusterId_fkey";

-- DropIndex
DROP INDEX "public"."ProjectRequest_awsK8sClusterId_key";

-- DropIndex
DROP INDEX "public"."ProjectRequest_azureK8sClusterId_key";

-- AlterTable
ALTER TABLE "public"."ProjectRequest" DROP COLUMN "awsK8sClusterId",
DROP COLUMN "azureK8sClusterId";
