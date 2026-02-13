/*
  Warnings:

  - A unique constraint covering the columns `[resourcesId]` on the table `ProjectRequest` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "public"."ProjectRequest" DROP CONSTRAINT "ProjectRequest_repositoryId_fkey";

-- AlterTable
ALTER TABLE "public"."ProjectRequest" ADD COLUMN     "resourcesId" TEXT;

-- AlterTable
ALTER TABLE "public"."Repository" ALTER COLUMN "resourcesId" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "ProjectRequest_resourcesId_key" ON "public"."ProjectRequest"("resourcesId");

-- AddForeignKey
ALTER TABLE "public"."ProjectRequest" ADD CONSTRAINT "ProjectRequest_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "public"."Repository"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProjectRequest" ADD CONSTRAINT "ProjectRequest_resourcesId_fkey" FOREIGN KEY ("resourcesId") REFERENCES "public"."Resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;
