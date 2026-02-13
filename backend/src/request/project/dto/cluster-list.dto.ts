import { AwsK8sCluster, AzureK8sCluster } from "@prisma/client";

export class ClusterListDto {
    AzureK8sClusters?: AzureK8sCluster[];
    AwsK8sClusters?: AwsK8sCluster[];
}