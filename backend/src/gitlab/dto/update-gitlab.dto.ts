import { PartialType } from '@nestjs/swagger';
import { CreateGitlabDto } from './create-gitlab.dto';

export class UpdateGitlabDto extends PartialType(CreateGitlabDto) {}
