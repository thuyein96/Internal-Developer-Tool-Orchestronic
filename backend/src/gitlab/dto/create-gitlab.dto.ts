import { IsString, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateGitlabDto {
  @ApiProperty({
    example: 'nestjs-repo',
    description: 'The name of the GitLab project',
  })
  @IsString()
  name: string;

  @ApiProperty({
    example: 'A sample NestJS project',
    description: 'The description of the GitLab project',
  })
  @IsString()
  description: string;
}
