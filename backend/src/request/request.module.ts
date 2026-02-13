import { Module } from '@nestjs/common';
import { RequestController } from './request.controller';
import { RequestService } from './request.service';
import { DatabaseModule } from '../database/database.module';
import { GitlabService } from '../gitlab/gitlab.service';
import { RepositoriesService } from '../repositories/repositories.service';
import { RabbitmqService } from '../rabbitmq/rabbitmq.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { PassportModule } from '@nestjs/passport';
import { AirflowService } from '../airflow/airflow.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    HttpModule,
    DatabaseModule,
    ClientsModule.register([
      {
        name: 'RABBITMQ_SERVICE_1',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://airflow:airflow@20.2.248.253:5672'],
          queue: 'request',
        },
      },
      {
        name: 'RABBITMQ_SERVICE_2',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://airflow:airflow@20.2.248.253:5672'],
          queue: 'destroy',
        },
      },
      {
        name: 'RABBITMQ_SERVICE_3',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://airflow:airflow@20.2.248.253:5672'],
          queue: 'resource',
        },
      },
      {
        name: 'RABBITMQ_SERVICE_4',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://airflow:airflow@20.2.248.253:5672'],
          queue: 'destroyK8s',
        },
      },
    ]),
    PassportModule.register({
      defaultStrategy: 'AzureAD',
    }),
  ],
  controllers: [RequestController],
  providers: [
    RequestService,
    GitlabService,
    RepositoriesService,
    RabbitmqService,
    AirflowService,
  ],
})
export class RequestModule {}
