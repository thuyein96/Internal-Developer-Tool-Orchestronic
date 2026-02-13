import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsString } from "class-validator";

export class CreateAWSK8sClusterDto {
    @ApiProperty({
        example: 'my-aws-cluster',
        description: 'The name of the AWS cluster',
    })
    @IsString()
    clusterName: string;

    @ApiProperty({
        example: 1,
        description: 'The number of nodes in the AWS cluster',
    })
    @IsInt()
    nodeCount: number;

    @ApiProperty({
        example: 't3.micro',
        description: 'The size of the nodes in the AWS cluster',
    })
    @IsString()
    nodeSize: string;
}