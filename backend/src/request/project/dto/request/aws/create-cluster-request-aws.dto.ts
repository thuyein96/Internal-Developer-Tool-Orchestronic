import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";
import { CreateAWSClusterResourceDto } from "./create-aws-cluster-resource.dto";

export class CreateAWSClusterRequestDto {
    @IsString()
    @IsOptional()
    @ApiProperty({
        example: 'Cluster request description',
        description: 'A description of the cluster request',
        required: false,
    })
    description: string;

    @ApiProperty({ type: CreateAWSClusterResourceDto })
    resources: CreateAWSClusterResourceDto;
}