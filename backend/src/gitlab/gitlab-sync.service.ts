import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class GitlabSyncService {
  private readonly logger = new Logger(GitlabSyncService.name);
  private readonly GITLAB_URL = process.env.GITLAB_URL || '';
  private readonly TOKEN = process.env.GITLAB_TOKEN || '';

  constructor(private databaseService: DatabaseService) {}

  // @Cron('0 * * * *') // every hour
  // @Cron('* * * * *') // every minute
  async syncRepositories() {
    try {
      this.logger.log('Starting GitLab repository sync...');

      // 1️⃣ Fetch all projects from GitLab
      const res = await fetch(`${this.GITLAB_URL}/projects`, {
        headers: { 'PRIVATE-TOKEN': this.TOKEN },
      });

      if (!res.ok) throw new Error(`GitLab API request failed: ${res.status}`);

      const gitlabProjects = (await res.json()) as {
        id: number;
        name: string;
      }[];
      const gitlabNames = gitlabProjects.map((p) => p.name);

      // 2️⃣ Fetch all DB repos
      const dbRepos = await this.databaseService.repository.findMany();
      const dbNames = dbRepos.map((r) => r.name);

      // 3️⃣ Find GitLab projects NOT in DB → delete from GitLab
      const toDeleteFromGitlab = gitlabProjects.filter(
        (p) => !dbNames.includes(p.name),
      );

      for (const repo of toDeleteFromGitlab) {
        try {
          await fetch(`${this.GITLAB_URL}/projects/${repo.id}`, {
            method: 'DELETE',
            headers: { 'PRIVATE-TOKEN': this.TOKEN },
          });
          this.logger.log(`Deleted GitLab repo: ${repo.name}`);
        } catch (err) {
          this.logger.error(`Failed to delete GitLab repo: ${repo.name}`, err);
        }
      }

      // 4️⃣ Find DB repos NOT in GitLab → delete from DB
      const toDeleteFromDB = dbRepos.filter(
        (r) => !gitlabNames.includes(r.name),
      );

      for (const repo of toDeleteFromDB) {
        await this.databaseService.repository.delete({
          where: { name: repo.name },
        });
        this.logger.log(`Deleted DB repo: ${repo.name}`);
      }

      this.logger.log('GitLab repository sync completed.');
    } catch (err) {
      this.logger.error('Failed to sync GitLab repositories', err);
    }
  }
}
