import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AuthRefreshDto {
  @ApiProperty({
    description: 'Refresh token to exchange for new access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    type: String,
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

export class AuthRefreshResponseDto {
  @ApiProperty({
    description: 'New backend access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    type: String,
  })
  accessToken: string;
}
