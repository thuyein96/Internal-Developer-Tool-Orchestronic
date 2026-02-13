import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { InfrastructureService } from './infrastructure.service';
import { InfrastructureController } from './infrastructure.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AirflowService } from '../airflow/airflow.service';
import { RabbitmqService } from '../rabbitmq/rabbitmq.service';
import { HttpModule } from '@nestjs/axios';
import { GitlabService } from '../gitlab/gitlab.service';

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
  ],
  controllers: [InfrastructureController],
  providers: [
    InfrastructureService,
    AirflowService,
    RabbitmqService,
    GitlabService,
  ],
})
export class InfrastructureModule {}
