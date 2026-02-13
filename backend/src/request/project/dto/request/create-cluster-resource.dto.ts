import { ApiProperty } from '@nestjs/swagger';
import { CreateClusterResourceConfigDto } from './create-cluster-resource-config.dto';
export class CreateClusterResourceDto {
  @ApiProperty({
    example: 'rg-repository-name',
    description: 'The name of the resource group',
  })
  name: string;

  @ApiProperty({
    example: 'azure',
    description: 'The cloud provider for the resources',
    required: false,
  })
  cloudProvider: string;

  @ApiProperty({
    example: 'eastasia',
    description: 'The region where the resources are located',
    required: false,
  })
  region: string;

  @ApiProperty({
    type: CreateClusterResourceConfigDto })
  resourceConfig: CreateClusterResourceConfigDto;
}