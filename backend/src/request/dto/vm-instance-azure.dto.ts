import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString } from 'class-validator';

export class CreateAzureVMInstanceDto {
  @ApiProperty({
    example: 'vm-instance-name',
    description: 'The name of the virtual machine instance',
  })
  @IsString()
  name: string;

  @ApiProperty({
    example: '1',
    description: 'The number of CPU cores for the virtual machine instance',
  })
  @IsInt()
  numberOfCores: number;

  @ApiProperty({
    example: '2048',
    description:
      'The amount of memory (in MB) for the virtual machine instance',
  })
  @IsInt()
  memory: number;

  @ApiProperty({
    example: 'ubuntu-20.04',
    description: 'The operating system for the virtual machine instance',
  })
  @IsString()
  os: string;

  @ApiProperty({
    example: 'size-id',
    description: 'The ID of the Azure VM size for the instance',
  })
  @IsString()
  sizeId: string;
}
