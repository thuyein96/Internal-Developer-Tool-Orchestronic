import { AzureK8sClusterDto } from "./cluster-response-azure.dto";

export class GetClusterByIdResponseDto {
    statuscode: number;
    message: AzureK8sClusterDto;
}