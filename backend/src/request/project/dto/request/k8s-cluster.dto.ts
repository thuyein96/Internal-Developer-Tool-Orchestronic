import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsOptional, IsString } from "class-validator";

export class CreateK8sClusterDto {
    @ApiProperty({
        example: 'my-k8s-cluster',
        description: 'The name of the K8s cluster',
    })
    @IsString()
    clusterName: string;

    @ApiProperty({
        example: 1,
        description: 'The number of nodes in the K8s cluster',
    })
    @IsInt()
    nodeCount: number;

    @ApiProperty({
        example: 'Standard_D2s_v3',
        description: 'The size of the nodes in the K8s cluster',
    })
    @IsString()
    nodeSize: string;
}