import { ApiProperty } from "@nestjs/swagger";
import { Status } from "@prisma/client";
import { IsOptional, IsString } from "class-validator";
export class UpdateClusterRequestStatusDto {
    // @IsString()
    // @ApiProperty({ example: 'uuid-of-cluster-request' })
    // requestId: string;

    @IsString()
    @IsOptional()
    @ApiProperty({
        example: 'Cluster request description',
        description: 'A description of the cluster request',
        required: false,
    })
    clusterRequestId: string;

    @IsString()
    @IsOptional()
    @ApiProperty({
        example: 'Cluster request description',
        description: 'A description of the cluster request',
        required: false,
    })
    status: Status;
}