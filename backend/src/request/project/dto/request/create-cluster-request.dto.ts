import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { CreateClusterResourceDto } from '../../../../request/project/dto/request/create-cluster-resource.dto';
export class CreateClusterRequestDto {
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
  description: string;

  @ApiProperty({ type: CreateClusterResourceDto })
  resources: CreateClusterResourceDto;
}
