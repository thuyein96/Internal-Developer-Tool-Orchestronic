/*
  Warnings:

  - The primary key for the `AwsInstanceType` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `InstanceType` on the `AwsInstanceType` table. All the data in the column will be lost.
  - You are about to drop the column `core` on the `AwsInstanceType` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `AwsInstanceType` table. All the data in the column will be lost.
  - You are about to drop the column `ram` on the `AwsInstanceType` table. All the data in the column will be lost.
  - You are about to drop the column `region` on the `AwsInstanceType` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name]` on the table `AwsInstanceType` will be added. If there are existing duplicate values, this will fail.
  - The required column `id` was added to the `AwsInstanceType` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `memoryInMB` to the `AwsInstanceType` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `AwsInstanceType` table without a default value. This is not possible if the table is not empty.
  - Added the required column `numberOfCores` to the `AwsInstanceType` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `cloudProvider` on the `Resources` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "public"."AwsInstanceType" DROP CONSTRAINT "AwsInstanceType_pkey",
DROP COLUMN "InstanceType",
DROP COLUMN "core",
DROP COLUMN "createdAt",
DROP COLUMN "ram",
DROP COLUMN "region",
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "memoryInMB" INTEGER NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "numberOfCores" INTEGER NOT NULL,
ADD CONSTRAINT "AwsInstanceType_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."Resources" DROP COLUMN "cloudProvider",
ADD COLUMN     "cloudProvider" "public"."CloudProvider" NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "AwsInstanceType_name_key" ON "public"."AwsInstanceType"("name");
