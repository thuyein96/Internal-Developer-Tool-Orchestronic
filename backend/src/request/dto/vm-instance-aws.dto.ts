import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString } from 'class-validator';

export class CreateAwsVMInstanceDto {
  @ApiProperty({
    example: 'vm-instance-name',
    description: 'The name of the virtual machine instance',
  })
  @IsString()
  instanceName: string;

  @ApiProperty({
    example: 'my-key-pair',
    description: 'The key name for the virtual machine instance',
  })
  @IsString()
  keyName: string;

  @ApiProperty({
    example: 'sg-12345678',
    description: 'The security group name for the virtual machine instance',
  })
  @IsString()
  sgName: string;

  @ApiProperty({
    example: '21312312312312312',
    description:
      'The resource configuration ID associated with the virtual machine instance',
  })
  @IsInt()
  resourceConfigId: number;

  @ApiProperty({
    example: 'ubuntu-20.04',
    description: 'The operating system for the virtual machine instance',
  })
  @IsString()
  os: string;

  @ApiProperty({
    example: '21312312312312312',
    description: 'The AWS instance type ID for the virtual machine instance',
  })
  @IsString()
  awsInstanceTypeId: string;
}
