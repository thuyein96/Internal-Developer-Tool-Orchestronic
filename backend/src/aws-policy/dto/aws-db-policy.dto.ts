import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class AwsDBPolicyDto {
  @IsNotEmpty()
  @IsNumber()
  @ApiProperty({
    example: 500,
    description: 'The maximum storage (in GB) allocated for the database',
  })
  maxStorage: number;
}
