/*
  Warnings:

  - You are about to drop the column `resourcesId` on the `Repository` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Repository` table. All the data in the column will be lost.
  - You are about to drop the column `repositoryId` on the `Request` table. All the data in the column will be lost.
  - You are about to drop the column `resourcesId` on the `Request` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[requestId,name]` on the table `Repository` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[requestId]` on the table `Resources` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `requestId` to the `Repository` table without a default value. This is not possible if the table is not empty.
  - Added the required column `requestId` to the `Resources` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."Repository" DROP CONSTRAINT "Repository_resourcesId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Request" DROP CONSTRAINT "Request_repositoryId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Request" DROP CONSTRAINT "Request_resourcesId_fkey";

-- DropIndex
DROP INDEX "public"."Repository_name_key";

-- DropIndex
DROP INDEX "public"."Repository_resourcesId_key";

-- DropIndex
DROP INDEX "public"."Request_repositoryId_key";

-- DropIndex
DROP INDEX "public"."Request_resourcesId_key";

-- AlterTable
ALTER TABLE "public"."Repository" DROP COLUMN "resourcesId",
DROP COLUMN "status",
ADD COLUMN     "requestId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."Request" DROP COLUMN "repositoryId",
DROP COLUMN "resourcesId";

-- AlterTable
ALTER TABLE "public"."Resources" ADD COLUMN     "requestId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Repository_requestId_name_key" ON "public"."Repository"("requestId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Resources_requestId_key" ON "public"."Resources"("requestId");

-- AddForeignKey
ALTER TABLE "public"."Repository" ADD CONSTRAINT "Repository_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "public"."Request"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Resources" ADD CONSTRAINT "Resources_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "public"."Request"("id") ON DELETE CASCADE ON UPDATE CASCADE;
