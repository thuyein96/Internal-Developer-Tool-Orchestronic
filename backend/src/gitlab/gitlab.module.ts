import { Module } from '@nestjs/common';
import { GitlabService } from './gitlab.service';
import { GitlabController } from './gitlab.controller';
import { DatabaseModule } from '../database/database.module';
import { GitlabSyncService } from './gitlab-sync.service';

@Module({
  imports: [DatabaseModule],
  controllers: [GitlabController],
  providers: [GitlabService, GitlabSyncService],
  exports: [GitlabService, GitlabSyncService],
})
export class GitlabModule {}
