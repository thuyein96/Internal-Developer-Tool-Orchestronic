import { IsNumber, IsOptional, IsString } from "class-validator";
import { Unique } from "typeorm";

export class AzureK8sClusterDto {
    @IsString()
    id: string;
    @IsString()
    clusterName: string;
    @IsNumber()
    nodeCount: number;
    @IsString()
    nodeSize: string;
    @IsOptional()
    @IsString()
    kubeConfig?: string;
    @IsOptional()
    @IsString()
    clusterFqdn?: string;
    @IsOptional()
    @IsString()
    terraformState?: string;
    @IsString()
    resourceConfigId: string;
}