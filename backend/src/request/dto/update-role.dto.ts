import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class UpdateRoleDto {
  @ApiProperty({ example: 'user-uuid-here' })
  id: string;

  @ApiProperty({ enum: Role })
  role: Role;
}
