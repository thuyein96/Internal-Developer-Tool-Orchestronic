-- CreateEnum
CREATE TYPE "public"."deployStatus" AS ENUM ('Pending', 'Deployed');

-- AlterTable
ALTER TABLE "public"."Request" ALTER COLUMN "resourcesId" DROP NOT NULL;
