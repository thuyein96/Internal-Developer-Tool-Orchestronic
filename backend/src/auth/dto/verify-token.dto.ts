import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyTokenDto {
  @ApiProperty({
    description: 'JWT token to verify',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  token: string;
}
