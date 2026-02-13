-- AlterTable
ALTER TABLE "public"."AwsVMInstance" ADD COLUMN     "pem" TEXT;

-- AlterTable
ALTER TABLE "public"."AzureVMInstance" ADD COLUMN     "pem" TEXT;
