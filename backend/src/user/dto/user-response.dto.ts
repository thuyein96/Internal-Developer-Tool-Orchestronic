import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class UserResponseDto {
  id: string;
  @ApiProperty({
    required: true,
    description: 'User full name',
    example: 'John Doe',
  })
  name: string;

  @ApiProperty({
    required: true,
    description: 'User email address',
    example: 'u6512345@au.edu',
  })
  email: string;

  @ApiProperty({
    enum: Role,
    enumName: 'Role',
    required: true,
    description: 'User role in the system',
    example: Role.Developer,
  })
  role: Role;
}
