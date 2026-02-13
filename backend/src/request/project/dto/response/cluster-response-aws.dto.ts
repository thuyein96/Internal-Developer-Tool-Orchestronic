import { IsNumber, IsOptional, IsString } from "class-validator";

export class AwsK8sClusterDto {
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
    clusterEndpoint?: string;
    @IsOptional()
    @IsString()
    terraformState?: string;
    @IsString()
    resourceConfigId: string;
}
