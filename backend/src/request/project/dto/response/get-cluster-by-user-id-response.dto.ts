import { Type } from "class-transformer";
import { IsArray, IsNumber, IsString, ValidateNested } from "class-validator";
import { AwsK8sClusterDto } from "./cluster-response-aws.dto";
import { AzureK8sClusterDto } from "./cluster-response-azure.dto";

export class UserClustersPayloadDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => AwsK8sClusterDto)
    awsClusters: AwsK8sClusterDto[];

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => AzureK8sClusterDto)
    azureClusters: AzureK8sClusterDto[];
}

export class GetClusterByUserIdResponseDto {
    @IsNumber()
    statuscode: number;

    @ValidateNested()
    @Type(() => UserClustersPayloadDto)
    data: UserClustersPayloadDto;
}