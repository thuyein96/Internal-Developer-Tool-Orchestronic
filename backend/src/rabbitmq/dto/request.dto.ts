import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RequestDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: 'A8fL-x9Vw-03hYd2N',
    description: 'send the request ID to RabbitMQ',
    required: true,
  })
  requestId: string;
}
