import { ApiProperty } from '@nestjs/swagger';
import { CreateAzureVMInstanceDto } from './vm-instance-azure.dto';
import { IsArray, IsOptional } from 'class-validator';
import { CreateAwsVMInstanceDto } from './vm-instance-aws.dto';
import { CreateAwsDatabaseInstanceDto } from './db-instance-aws.dto';
import { CreateAwsStorageInstanceDto } from './storage-instance-aws.dto';

export class CreateResourceAwsConfigDto {
  @ApiProperty({
    type: [CreateAzureVMInstanceDto],
    description: 'List of virtual machine instances to be created',
  })
  @IsOptional()
  @IsArray()
  vms: CreateAwsVMInstanceDto[];

  @ApiProperty({
    type: [CreateAwsDatabaseInstanceDto],
    description: 'List of database instances to be created',
  })
  @IsOptional()
  @IsArray()
  dbs: CreateAwsDatabaseInstanceDto[];

  @ApiProperty({
    type: [CreateAwsStorageInstanceDto],
    description: 'List of storage instances to be created',
  })
  @IsOptional()
  @IsArray()
  sts: CreateAwsStorageInstanceDto[];
}
