import { ApiProperty } from '@nestjs/swagger';
import { CreateResourceAwsConfigDto } from '../../request/dto/create-resource-aws-config.dto';

export class CreateAwsResourceDto {
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
    example: 'us-west-2',
    description: 'The region where the resources are located',
    required: false,
  })
  region: string;

  @ApiProperty({
    type: CreateResourceAwsConfigDto,
    description: 'Configuration details for the resources',
  })
  resourceConfig: CreateResourceAwsConfigDto;
}
