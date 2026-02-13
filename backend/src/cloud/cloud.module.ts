import { Module } from '@nestjs/common';
import { CloudController } from './cloud.controller';
import { CloudService } from './cloud.service';
import { DatabaseModule } from '../database/database.module';
import { GitlabModule } from '../gitlab/gitlab.module';

@Module({
  imports: [DatabaseModule, GitlabModule],
  controllers: [CloudController],
  providers: [CloudService],
})
export class CloudModule {}
