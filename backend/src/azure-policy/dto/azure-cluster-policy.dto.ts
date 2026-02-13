import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class AzureClusterPolicyDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    example: 'cluster-policy-name',
    description: 'The name of the cluster policy',
  })
  name: string;

  @IsNotEmpty()
  @IsNumber()
  @ApiProperty({
    example: 4,
    description: 'The number of CPU cores allocated for the cluster',
  })
  numberOfCores: number;

  @IsNotEmpty()
  @IsNumber()
  @ApiProperty({
    example: 8192,
    description:
      'The amount of memory (in GB) allocated for the cluster',
  })
  memoryInMB: number;
}
