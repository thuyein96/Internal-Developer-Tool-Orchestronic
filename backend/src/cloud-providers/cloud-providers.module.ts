import { Module } from '@nestjs/common';
import { CloudProvidersService } from './cloud-providers.service';
import { CloudProvidersController } from './cloud-providers.controller';
import { DatabaseModule } from '../database/database.module';
import { RequestService } from '../request/request.service';
import { AirflowModule } from '../airflow/airflow.module';
import { RabbitmqModule } from '../rabbitmq/rabbitmq.module';
import { GitlabModule } from '../gitlab/gitlab.module';

@Module({
  imports: [DatabaseModule, RabbitmqModule, AirflowModule, GitlabModule],
  controllers: [CloudProvidersController],
  providers: [CloudProvidersService, RequestService],
})
export class CloudProvidersModule {}
