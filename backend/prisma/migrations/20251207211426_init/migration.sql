-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "gitlabUrl" TEXT;

-- CreateTable
CREATE TABLE "public"."AzureK8sCluster" (
    "id" TEXT NOT NULL,
    "clusterName" TEXT NOT NULL,
    "nodeCount" INTEGER NOT NULL DEFAULT 3,
    "nodeSize" TEXT NOT NULL DEFAULT 'Standard_D2s_v3',
    "kubeConfig" TEXT,
    "clusterFqdn" TEXT,
    "terraformState" JSONB,
    "resourceConfigId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AzureK8sCluster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AzureAksNodeType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "numberOfCores" INTEGER NOT NULL,
    "memoryInMB" INTEGER NOT NULL,
    "description" TEXT,
    "raw" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AzureAksNodeType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AzurePolicyK8s" (
    "id" TEXT NOT NULL,
    "maxNodeCount" INTEGER NOT NULL DEFAULT 10,
    "maxClustersPerUser" INTEGER NOT NULL DEFAULT 5,
    "allowedNodeTypes" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AzurePolicyK8s_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AwsK8sCluster" (
    "id" TEXT NOT NULL,
    "clusterName" TEXT NOT NULL,
    "nodeCount" INTEGER NOT NULL DEFAULT 3,
    "nodeSize" TEXT NOT NULL DEFAULT 't3.medium',
    "kubeConfig" TEXT,
    "clusterEndpoint" TEXT,
    "terraformState" JSONB,
    "resourceConfigId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AwsK8sCluster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AwsEksNodeType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "numberOfCores" INTEGER NOT NULL,
    "memoryInMB" INTEGER NOT NULL,
    "description" TEXT,
    "raw" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AwsEksNodeType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AwsPolicyK8s" (
    "id" TEXT NOT NULL,
    "maxNodeCount" INTEGER NOT NULL DEFAULT 10,
    "maxClustersPerUser" INTEGER NOT NULL DEFAULT 5,
    "allowedNodeTypes" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AwsPolicyK8s_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."K8sDeployment" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "replicas" INTEGER NOT NULL DEFAULT 3,
    "port" INTEGER NOT NULL DEFAULT 80,
    "environmentVars" JSONB,
    "awsClusterId" TEXT,
    "azureClusterId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "K8sDeployment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."K8sService" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'LoadBalancer',
    "port" INTEGER NOT NULL DEFAULT 80,
    "targetPort" INTEGER NOT NULL DEFAULT 80,
    "appSelector" TEXT NOT NULL,
    "awsClusterId" TEXT,
    "azureClusterId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "K8sService_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AzureK8sCluster_resourceConfigId_idx" ON "public"."AzureK8sCluster"("resourceConfigId");

-- CreateIndex
CREATE UNIQUE INDEX "AzureAksNodeType_name_key" ON "public"."AzureAksNodeType"("name");

-- CreateIndex
CREATE INDEX "AwsK8sCluster_resourceConfigId_idx" ON "public"."AwsK8sCluster"("resourceConfigId");

-- CreateIndex
CREATE UNIQUE INDEX "AwsEksNodeType_name_key" ON "public"."AwsEksNodeType"("name");

-- CreateIndex
CREATE INDEX "K8sDeployment_awsClusterId_idx" ON "public"."K8sDeployment"("awsClusterId");

-- CreateIndex
CREATE INDEX "K8sDeployment_azureClusterId_idx" ON "public"."K8sDeployment"("azureClusterId");

-- CreateIndex
CREATE INDEX "K8sService_awsClusterId_idx" ON "public"."K8sService"("awsClusterId");

-- CreateIndex
CREATE INDEX "K8sService_azureClusterId_idx" ON "public"."K8sService"("azureClusterId");

-- AddForeignKey
ALTER TABLE "public"."AzureK8sCluster" ADD CONSTRAINT "AzureK8sCluster_resourceConfigId_fkey" FOREIGN KEY ("resourceConfigId") REFERENCES "public"."ResourceConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AwsK8sCluster" ADD CONSTRAINT "AwsK8sCluster_resourceConfigId_fkey" FOREIGN KEY ("resourceConfigId") REFERENCES "public"."ResourceConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."K8sDeployment" ADD CONSTRAINT "K8sDeployment_awsClusterId_fkey" FOREIGN KEY ("awsClusterId") REFERENCES "public"."AwsK8sCluster"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."K8sDeployment" ADD CONSTRAINT "K8sDeployment_azureClusterId_fkey" FOREIGN KEY ("azureClusterId") REFERENCES "public"."AzureK8sCluster"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."K8sService" ADD CONSTRAINT "K8sService_awsClusterId_fkey" FOREIGN KEY ("awsClusterId") REFERENCES "public"."AwsK8sCluster"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."K8sService" ADD CONSTRAINT "K8sService_azureClusterId_fkey" FOREIGN KEY ("azureClusterId") REFERENCES "public"."AzureK8sCluster"("id") ON DELETE CASCADE ON UPDATE CASCADE;
