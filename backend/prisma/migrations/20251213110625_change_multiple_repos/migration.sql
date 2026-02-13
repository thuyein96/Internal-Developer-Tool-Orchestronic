/*
  Warnings:

  - You are about to drop the `ownedRepository` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[name]` on the table `Repository` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[resourcesId]` on the table `Repository` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[gitlabProjectId]` on the table `Repository` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[gitlabId]` on the table `Request` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `Repository` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."ownedRepository" DROP CONSTRAINT "ownedRepository_repositoryId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ownedRepository" DROP CONSTRAINT "ownedRepository_userId_fkey";

-- DropIndex
DROP INDEX "public"."Repository_requestId_name_key";

-- DropIndex
DROP INDEX "public"."Resources_requestId_key";

-- AlterTable
ALTER TABLE "public"."Repository" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "gitlabProjectId" INTEGER,
ADD COLUMN     "resourcesId" TEXT,
ADD COLUMN     "status" "public"."RepositoryStatus" NOT NULL DEFAULT 'Pending',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "public"."Request" ADD COLUMN     "gitlabId" INTEGER;

-- AlterTable
ALTER TABLE "public"."Resources" ALTER COLUMN "requestId" DROP NOT NULL;

-- DropTable
DROP TABLE "public"."ownedRepository";

-- CreateIndex
CREATE UNIQUE INDEX "Repository_name_key" ON "public"."Repository"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Repository_resourcesId_key" ON "public"."Repository"("resourcesId");

-- CreateIndex
CREATE UNIQUE INDEX "Repository_gitlabProjectId_key" ON "public"."Repository"("gitlabProjectId");

-- CreateIndex
CREATE UNIQUE INDEX "Request_gitlabId_key" ON "public"."Request"("gitlabId");

-- AddForeignKey
ALTER TABLE "public"."Repository" ADD CONSTRAINT "Repository_resourcesId_fkey" FOREIGN KEY ("resourcesId") REFERENCES "public"."Resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;
