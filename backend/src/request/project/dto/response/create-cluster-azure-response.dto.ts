import { NewClusterDto } from "./new-cluster-azure.dto";

export class CreateClusterAzureResponseDto {
    statuscode: number;
    message: NewClusterDto;
}