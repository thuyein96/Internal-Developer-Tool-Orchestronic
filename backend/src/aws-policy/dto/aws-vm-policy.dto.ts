import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class AwsVMPolicyDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    example: 'vm-policy-name',
    description: 'The name of the virtual machine policy',
  })
  name: string;

  @IsNotEmpty()
  @IsNumber()
  @ApiProperty({
    example: 4,
    description: 'The number of CPU cores allocated for the virtual machine',
  })
  numberOfCores: number;

  @IsNotEmpty()
  @IsNumber()
  @ApiProperty({
    example: 8192,
    description:
      'The amount of memory (in GB) allocated for the virtual machine',
  })
  memoryInMB: number;
}
