import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  ValidateNested,
  IsNumberString,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CollaboratorDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: 'collaborator-id',
    description: 'ID of the collaborator',
  })
  userId: string;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({
    example: 12345,
    description: 'GitLab user ID of the collaborator',
  })
  gitlabUserId: number;
}

export class CreateRepositoryDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: 'repository-name',
    description: 'The name of the repository associated with the request',
  })
  name: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    example: 'repository-description',
    description: 'A description of the repository associated with the request',
    required: false,
  })
  description: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CollaboratorDto)
  @ApiProperty({
    type: [CollaboratorDto],
    description: 'List of collaborators for the repository',
    required: false,
  })
  collaborators?: CollaboratorDto[];
}
