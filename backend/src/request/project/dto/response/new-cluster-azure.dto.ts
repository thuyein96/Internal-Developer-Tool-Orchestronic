import { ApiProperty } from "@nestjs/swagger";
import { Status } from "@prisma/client";
import { IsOptional, IsString } from "class-validator";

export class NewClusterDto {
    @IsString()
    @ApiProperty({
        example: 'uuid-of-owner',
        description: 'The unique identifier of the owner of the cluster',
        required: true,
    })
    ownerId: string;

    @IsOptional()
    @ApiProperty({
        example: 'uuid-of-cluster-request',
        description: 'The unique identifier of the associated cluster request',
        required: true,
    })
    clusterReqId?: string;
}