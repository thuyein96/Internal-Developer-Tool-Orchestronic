import { ApiProperty } from '@nestjs/swagger';

export class FindUserByEmailDto {
  @ApiProperty({
    required: true,
    description: 'User email address to search for users',
    example: 'u6512345@au.edu',
  })
  email: string;
}
