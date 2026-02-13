import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
} from 'class-validator';
import { Role } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    required: true,
    description: 'User full name',
    example: 'John Doe',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    required: true,
    description: 'User email address',
    example: 'u6512345@au.edu',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    enum: Role,
    required: true,
    description: 'User role in the system',
    example: Role.Developer,
  })
  @IsEnum(Role)
  role: Role;

  @ApiPropertyOptional({
    description: 'Optional GitLab Profile URL',
    example: 'https://gitlab.com/username',
  })
  @IsOptional()
  @Matches(/^http?:\/\/[A-Za-z0-9.-]+(?::\d+)?\/[A-Za-z0-9._-]+\/?$/, {
    message: 'Invalid GitLab URL format',
  })
  gitlabUrl?: string
  
  @ApiPropertyOptional({
    description: 'Optional GitLab Name',
    example: 'gitlab_username',
  })
  @IsOptional()
  gitlabName?: string;;

  @ApiPropertyOptional({
    description: 'Optional GitLab Id',
    example: '4',
  })
  @IsOptional()
  gitlabId?: number;;
}
