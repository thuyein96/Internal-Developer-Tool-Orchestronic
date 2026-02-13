import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AuthExchangeDto {
  @ApiProperty({
    description: 'Azure AD access token to exchange for backend tokens',
    example: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6...',
    type: String,
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  azureToken: string;
}

export class AuthExchangeResponseDto {
  @ApiProperty({
    description: 'Backend access token for API authentication',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    type: String,
  })
  accessToken: string;

  // @ApiProperty({
  //   description: 'Backend refresh token for API authentication',
  //   example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  //   type: String,
  // })
  // refreshToken: string;
}
