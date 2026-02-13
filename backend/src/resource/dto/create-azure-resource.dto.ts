import { ApiProperty } from '@nestjs/swagger';
import { CreateResourceAzureConfigDto } from '../../request/dto/create-resource-azure-config.dto';

export class CreateAzureResourceDto {
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
    type: CreateResourceAzureConfigDto,
    description: 'Configuration details for the resources',
  })
  resourceConfig: CreateResourceAzureConfigDto;
}
