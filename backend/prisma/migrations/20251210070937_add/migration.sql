-- AlterTable
ALTER TABLE "public"."ownedRepository" ADD COLUMN     "aksClusterId" TEXT,
ADD COLUMN     "eksClusterId" TEXT;

-- CreateTable
CREATE TABLE "public"."ClusterRequest" (
    "id" TEXT NOT NULL,
    "status" "public"."Status" NOT NULL DEFAULT 'Pending',
    "description" TEXT NOT NULL,
    "resourcesId" TEXT,
    "repositoryId" TEXT,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "displayCode" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "feedback" TEXT,

    CONSTRAINT "ClusterRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClusterRequest_resourcesId_key" ON "public"."ClusterRequest"("resourcesId");

-- CreateIndex
CREATE UNIQUE INDEX "ClusterRequest_repositoryId_key" ON "public"."ClusterRequest"("repositoryId");

-- CreateIndex
CREATE UNIQUE INDEX "ClusterRequest_displayCode_key" ON "public"."ClusterRequest"("displayCode");

-- AddForeignKey
ALTER TABLE "public"."ClusterRequest" ADD CONSTRAINT "ClusterRequest_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClusterRequest" ADD CONSTRAINT "ClusterRequest_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "public"."Repository"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClusterRequest" ADD CONSTRAINT "ClusterRequest_resourcesId_fkey" FOREIGN KEY ("resourcesId") REFERENCES "public"."Resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ownedRepository" ADD CONSTRAINT "ownedRepository_eksClusterId_fkey" FOREIGN KEY ("eksClusterId") REFERENCES "public"."AwsK8sCluster"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ownedRepository" ADD CONSTRAINT "ownedRepository_aksClusterId_fkey" FOREIGN KEY ("aksClusterId") REFERENCES "public"."AzureK8sCluster"("id") ON DELETE CASCADE ON UPDATE CASCADE;
