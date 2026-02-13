/*
  Warnings:

  - You are about to drop the column `createdAt` on the `Repository` table. All the data in the column will be lost.
  - You are about to drop the column `gitlabProjectId` on the `Repository` table. All the data in the column will be lost.
  - You are about to drop the column `requestId` on the `Repository` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Repository` table. All the data in the column will be lost.
  - You are about to drop the column `gitlabId` on the `Request` table. All the data in the column will be lost.
  - You are about to drop the column `requestId` on the `Resources` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[resourcesId]` on the table `Request` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[repositoryId]` on the table `Request` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `repositoryId` to the `Request` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."Repository" DROP CONSTRAINT "Repository_requestId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Resources" DROP CONSTRAINT "Resources_requestId_fkey";

-- DropIndex
DROP INDEX "public"."Repository_gitlabProjectId_key";

-- DropIndex
DROP INDEX "public"."Request_gitlabId_key";

-- AlterTable
ALTER TABLE "public"."Repository" DROP COLUMN "createdAt",
DROP COLUMN "gitlabProjectId",
DROP COLUMN "requestId",
DROP COLUMN "updatedAt";

-- AlterTable
ALTER TABLE "public"."Request" DROP COLUMN "gitlabId",
ADD COLUMN     "repositoryId" TEXT NOT NULL,
ADD COLUMN     "resourcesId" TEXT;

-- AlterTable
ALTER TABLE "public"."Resources" DROP COLUMN "requestId";

-- CreateTable
CREATE TABLE "public"."ownedRepository" (
    "userId" TEXT NOT NULL,
    "repositoryId" TEXT NOT NULL,

    CONSTRAINT "ownedRepository_pkey" PRIMARY KEY ("userId","repositoryId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Request_resourcesId_key" ON "public"."Request"("resourcesId");

-- CreateIndex
CREATE UNIQUE INDEX "Request_repositoryId_key" ON "public"."Request"("repositoryId");

-- AddForeignKey
ALTER TABLE "public"."Request" ADD CONSTRAINT "Request_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "public"."Repository"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Request" ADD CONSTRAINT "Request_resourcesId_fkey" FOREIGN KEY ("resourcesId") REFERENCES "public"."Resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ownedRepository" ADD CONSTRAINT "ownedRepository_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "public"."Repository"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ownedRepository" ADD CONSTRAINT "ownedRepository_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
