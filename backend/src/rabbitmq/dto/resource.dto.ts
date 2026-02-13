import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ResourceDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: 'A8fL-x9Vw-03hYd2N',
    description: 'send the resource ID to RabbitMQ',
    required: true,
  })
  resourceId: string;
}
