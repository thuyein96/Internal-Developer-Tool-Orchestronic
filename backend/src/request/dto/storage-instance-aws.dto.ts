import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateAwsStorageInstanceDto {
  @IsString()
  @ApiProperty({
    example: 'MyStorage',
    description: 'The name of the storage instance',
  })
  bucketName: string;
}
