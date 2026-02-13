import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateGitlabDto } from './dto/create-gitlab.dto';
import { UpdateGitlabDto } from './dto/update-gitlab.dto';

@Injectable()
export class GitlabService {
  private readonly gitlabUrl = process.env.GITLAB_URL || 'http://gitlaborchestronic.dev/api/v4';
  private readonly token = process.env.GITLAB_TOKEN;

  async createProject(createGitlabDto: CreateGitlabDto) {
    const response = await fetch(`${this.gitlabUrl}/projects`, {
      method: 'POST',
      headers: {
        'PRIVATE-TOKEN': this.token!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: createGitlabDto.name,
        description: createGitlabDto.description,
        // visibility: createGitlabDto.visibility,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`GitLab API error: ${error}`);
    }

    return response.json();
  }

  async getUserByUsername(username: string) {
    const response = await fetch(
      `${this.gitlabUrl}/users?username=${username}`,
      {
        headers: { 'PRIVATE-TOKEN': this.token! },
      },
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`GitLab API error: ${error}`);
    }

    const users = await response.json();

    if (!Array.isArray(users) || users.length === 0) {
      throw new NotFoundException(`GitLab user '${username}' not found`);
    }

    return users[0];
  }

  async createProjectForAUser(
    username: string,
    createGitlabDto: CreateGitlabDto,
  ) {
    // Step 1: Look up GitLab user by username
    const gitlabUser = await this.getUserByUsername(username);

    // Step 2: extract numeric GitLab userId
    const userId = gitlabUser.id;

    // Step 3: create the project under that user
    const response = await fetch(`${this.gitlabUrl}/projects/user/${userId}`, {
      method: 'POST',
      headers: {
        'PRIVATE-TOKEN': this.token!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: createGitlabDto.name,
        description: createGitlabDto.description,
        visibility: 'public',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`GitLab API error: ${error}`);
    }

    return response.json();
  }

  findAll() {
    return `This action returns all gitlab`;
  }

  async findOne(name: string) {
    const response = await fetch(`${this.gitlabUrl}/projects?search=${name}`, {
      method: 'GET',
      headers: {
        'PRIVATE-TOKEN': this.token!,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`GitLab API error: ${error}`);
    }

    return response.json();
  }

  update(id: number, updateGitlabDto: UpdateGitlabDto) {
    return `This action updates a #${id} gitlab`;
  }

  async remove(id: number) {
    return await fetch(`${this.gitlabUrl}/projects/${id}`, {
      method: 'DELETE',
      headers: { 'PRIVATE-TOKEN': this.token! },
    });
  }

  async listUsers() {
    const response = await fetch(`${this.gitlabUrl}/users`, {
      method: 'GET',
      headers: {
        'PRIVATE-TOKEN': this.token!,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`GitLab API error: ${error}`);
    }

    const users = await response.json();

    // Remove bots + admin accounts
    return users.filter((u: any) => !u.bot && !u.is_admin);
  }

  async approveUser(userId: number) {
    const response = await fetch(`${this.gitlabUrl}/users/${userId}/approve`, {
      method: 'POST',
      headers: {
        'PRIVATE-TOKEN': this.token!,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`GitLab API error: ${error}`);
    }

    return response.text();
  }

  async rejectUser(userId: number) {
    // Implement with your chosen GitLab endpoint (reject/block/delete)
    const response = await fetch(`${this.gitlabUrl}/users/${userId}/reject`, {
      method: 'POST',
      headers: {
        'PRIVATE-TOKEN': this.token!,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`GitLab API error: ${error}`);
    }

    return response.text();
  }

  async getProjectByName(name: string) {
    const response = await fetch(
      `${this.gitlabUrl}/projects?search=${encodeURIComponent(name)}`,
      {
        method: 'GET',
        headers: {
          'PRIVATE-TOKEN': this.token!,
          'Content-Type': 'application/json',
        },
      },
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`GitLab API error: ${error}`);
    }

    const projects = await response.json();
    return projects[0] ?? null;
  }

  async inviteUserToProject(projectId: number, gitlabUserId: number) {
    const response = await fetch(
      `${this.gitlabUrl}/projects/${projectId}/members`,
      {
        method: 'POST',
        headers: {
          'PRIVATE-TOKEN': this.token!,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `user_id=${gitlabUserId}&access_level=30`,
      },
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(
        `Failed to invite GitLab user ${gitlabUserId} to project ${projectId}: ${error}`,
      );
    }

    return response.json();
  }

  async getImageFromRegistry(projectId: number) {
    const response = await fetch(
      `${this.gitlabUrl}/projects/${projectId}/registry/repositories`,
      {
        method: 'GET',
        headers: {
          'PRIVATE-TOKEN': this.token!,
          'Content-Type': 'application/json',
        },
      },
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`GitLab API error: ${error}`);
    }

    const repos = await response.json();
    const repo = repos[0];

    return {
      name: repo.name,
      image: repo.location,
    };
  }
}
