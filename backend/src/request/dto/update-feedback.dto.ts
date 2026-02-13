import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateFeedbackDto {
  @IsString()
  @IsOptional()
  @ApiProperty({
    example: 'This is a feedback message',
    description: 'Feedback message for the request',
    required: false,
  })
  feedback?: string;
}
