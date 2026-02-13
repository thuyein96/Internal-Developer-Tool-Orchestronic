import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { RabbitmqController } from './rabbitmq.controller';
import { RabbitmqService } from './rabbitmq.service';

@Module({
  imports: [
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
  controllers: [RabbitmqController],
  providers: [RabbitmqService],
  exports: [RabbitmqService],
})
export class RabbitmqModule {}
