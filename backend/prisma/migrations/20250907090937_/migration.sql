/*
  Warnings:

  - Added the required column `dbAllocatedStorage` to the `AwsDatabaseInstance` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dbInstanceClass` to the `AwsDatabaseInstance` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dbName` to the `AwsDatabaseInstance` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dbPassword` to the `AwsDatabaseInstance` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dbUsername` to the `AwsDatabaseInstance` table without a default value. This is not possible if the table is not empty.
  - Added the required column `engine` to the `AwsDatabaseInstance` table without a default value. This is not possible if the table is not empty.
  - Added the required column `bucketName` to the `AwsStorageInstance` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."AwsDatabaseInstance" ADD COLUMN     "dbAllocatedStorage" INTEGER NOT NULL,
ADD COLUMN     "dbInstanceClass" TEXT NOT NULL,
ADD COLUMN     "dbName" TEXT NOT NULL,
ADD COLUMN     "dbPassword" TEXT NOT NULL,
ADD COLUMN     "dbUsername" TEXT NOT NULL,
ADD COLUMN     "engine" "public"."Engine" NOT NULL;

-- AlterTable
ALTER TABLE "public"."AwsStorageInstance" ADD COLUMN     "bucketName" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "public"."AwsDatabaseType" (
    "id" TEXT NOT NULL,
    "DBInstanceClass" TEXT NOT NULL,
    "engine" "public"."Engine" NOT NULL,
    "raw" JSONB NOT NULL,
    "MinStorageSize" INTEGER NOT NULL,
    "MaxStorageSize" INTEGER NOT NULL,

    CONSTRAINT "AwsDatabaseType_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AwsDatabaseType_DBInstanceClass_key" ON "public"."AwsDatabaseType"("DBInstanceClass");
