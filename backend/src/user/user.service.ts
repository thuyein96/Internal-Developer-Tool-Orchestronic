import { BadRequestException, Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateUserDto } from './dto/create-user.dto';
import { Role, User } from '@prisma/client';
import { BackendJwtPayload } from '../lib/types';
import { GitlabService } from '../gitlab/gitlab.service';

@Injectable()
export class UserService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly gitlabService: GitlabService,
  ) {}

  async createUser(user: CreateUserDto) {
    return await this.databaseService.user.create({
      data: {
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  }

  async updateRole(id: string, role: Role) {
    return this.databaseService.user.update({
      where: { id },
      data: { role },
    });
  }

  async findOne(email: string): Promise<User | null> {
    return await this.databaseService.user.findUnique({
      where: { email },
    });
  }

  async findById(id: string): Promise<User | null> {
    return await this.databaseService.user.findUnique({
      where: { id },
    });
  }

  async findAllUsers() {
    return await this.databaseService.user.findMany();
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.databaseService.user.findUnique({
      where: {
        email: email,
      },
    });
  }

  async fuzzyFindUsersByEmail(email: string): Promise<User[]> {
    return await this.databaseService.user.findMany({
      where: {
        email: {
          contains: email,
          mode: 'insensitive',
        },
      },
      take: 5,
    });
  }

  async findUserInfo(user: BackendJwtPayload) {
    return await this.databaseService.user.findUnique({
      where: { id: user.id },
    });
  }

  async addGitlabUrl(userId: string, gitlabUrl: string) {
    const username = this.extractGitlabUsername(gitlabUrl);
    const gitlabUser = await this.gitlabService.getUserByUsername(username);

    return await this.databaseService.user.update({
      where: { id: userId },
      data: {
        gitlabUrl,
        gitlabId: gitlabUser.id,
        gitlabName: username,
      },
    });
  }

  async getGitlabUrl(userId: string) {
    const user = await this.databaseService.user.findUnique({
      where: { id: userId },
      select: { gitlabUrl: true },
    });
    return { gitlabUrl: user?.gitlabUrl ?? null };
  }

  private extractGitlabUsername(gitlabUrl: string): string {
    try {
      const url = new URL(gitlabUrl);
      const segments = url.pathname.split('/').filter(Boolean);

      // First path segment is usually the username
      const username = segments[0];

      if (!username) {
        throw new Error('No username found in GitLab URL');
      }

      return username;
    } catch (err) {
      throw new BadRequestException('Invalid GitLab URL');
    }
  }
}
