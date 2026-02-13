/*
  Warnings:

  - A unique constraint covering the columns `[engine,DBInstanceClass]` on the table `AwsDatabaseType` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."AwsDatabaseType_DBInstanceClass_key";

-- CreateIndex
CREATE UNIQUE INDEX "AwsDatabaseType_engine_DBInstanceClass_key" ON "public"."AwsDatabaseType"("engine", "DBInstanceClass");
