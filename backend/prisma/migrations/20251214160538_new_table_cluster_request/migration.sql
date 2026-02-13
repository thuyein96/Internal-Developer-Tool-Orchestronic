/*
  Warnings:

  - You are about to drop the column `ownerId` on the `Resources` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Resources" DROP COLUMN "ownerId";

-- CreateTable
CREATE TABLE "public"."ClusterRequest" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "status" "public"."Status" NOT NULL DEFAULT 'Pending',

    CONSTRAINT "ClusterRequest_pkey" PRIMARY KEY ("id")
);
