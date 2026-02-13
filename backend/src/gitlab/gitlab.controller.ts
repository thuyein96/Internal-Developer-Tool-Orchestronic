import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { GitlabService } from './gitlab.service';
import { CreateGitlabDto } from './dto/create-gitlab.dto';
import { UpdateGitlabDto } from './dto/update-gitlab.dto';
import { GitlabSyncService } from './gitlab-sync.service';
import { ApiQuery } from '@nestjs/swagger';

@Controller('gitlab')
export class GitlabController {
  constructor(
    private readonly gitlabService: GitlabService,
    private readonly gitlabSyncService: GitlabSyncService,
  ) {}

  @Post()
  create(@Body() createGitlabDto: CreateGitlabDto) {
    return this.gitlabService.createProject(createGitlabDto);
  }

  @Post('users/:username/projects')
  async createProjectForAUser(
    @Param('username') username: string,
    @Body() dto: CreateGitlabDto,
  ) {
    return this.gitlabService.createProjectForAUser(username, dto);
  }

  @Get()
  findAll() {
    return this.gitlabService.findAll();
  }

  @Get('users')
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search term for filtering users',
  })
  async getUsers(@Query('search') search: string) {
    const users = await this.gitlabService.listUsers();

    if (!search || search.trim() === '') {
      return users;
    }

    const lower = search.toLowerCase();

    return users.filter((u: any) => {
      const username = u.username?.toLowerCase() ?? '';
      const email = u.email?.toLowerCase() ?? '';
      const name = u.name?.toLowerCase() ?? '';
      return (
        username.includes(lower) ||
        email.includes(lower) ||
        name.includes(lower)
      );
    });
  }

  @Get('sync')
  sync() {
    return this.gitlabSyncService.syncRepositories();
  }

  @Get(':name')
  findOne(@Param('name') name: string) {
    return this.gitlabService.findOne(name);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateGitlabDto: UpdateGitlabDto) {
    return this.gitlabService.update(+id, updateGitlabDto);
  }

  @Post('users/:id/approve')
  approveUser(@Param('id') id: string) {
    return this.gitlabService.approveUser(Number(id));
  }

  @Post('users/:id/reject')
  rejectUser(@Param('id') id: string) {
    return this.gitlabService.rejectUser(Number(id));
  }

  @Get('/registry/:projectId/image')
  getImageFromRegistry(@Param('projectId') projectId: string) {
    return this.gitlabService.getImageFromRegistry(Number(projectId));
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.gitlabService.remove(+id);
  }
}
