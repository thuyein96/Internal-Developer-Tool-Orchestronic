import { ApiProperty } from '@nestjs/swagger';
import { CreateClusterResourceAWSConfigDto } from './create-cluster-resource-aws-config.dto';
export class CreateAWSClusterResourceDto {
  @ApiProperty({
    example: 'rg-repository-name',
    description: 'The name of the resource group',
  })
  name: string;

  @ApiProperty({
    example: 'aws',
    description: 'The cloud provider for the resources',
    required: false,
  })
  cloudProvider: string;

  @ApiProperty({
    example: 'ap-southeast-1',
    description: 'The region where the resources are located',
    required: false,
  })
  region: string;

  @ApiProperty({
    type: CreateClusterResourceAWSConfigDto })
  resourceConfig: CreateClusterResourceAWSConfigDto;
}