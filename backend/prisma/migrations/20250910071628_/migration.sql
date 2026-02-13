-- AlterTable
ALTER TABLE "public"."AwsDatabaseInstance" ADD COLUMN     "terraformState" JSONB;

-- AlterTable
ALTER TABLE "public"."AwsStorageInstance" ADD COLUMN     "terraformState" JSONB;

-- AlterTable
ALTER TABLE "public"."AwsVMInstance" ADD COLUMN     "terraformState" JSONB;

-- AlterTable
ALTER TABLE "public"."AzureDatabaseInstance" ADD COLUMN     "terraformState" JSONB;

-- AlterTable
ALTER TABLE "public"."AzureStorageInstance" ADD COLUMN     "terraformState" JSONB;

-- AlterTable
ALTER TABLE "public"."AzureVMInstance" ADD COLUMN     "terraformState" JSONB;
