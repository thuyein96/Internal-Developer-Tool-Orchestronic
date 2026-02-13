import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { DatabaseModule } from '../database/database.module';
import { UserController } from './user.controller';
import { GitlabModule } from '../gitlab/gitlab.module';

@Module({
  imports: [DatabaseModule, GitlabModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
