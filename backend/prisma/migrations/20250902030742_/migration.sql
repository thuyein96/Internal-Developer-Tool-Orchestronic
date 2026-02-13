-- CreateTable
CREATE TABLE "public"."AwsInstanceType" (
    "InstanceType" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "raw" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AwsInstanceType_pkey" PRIMARY KEY ("InstanceType")
);
