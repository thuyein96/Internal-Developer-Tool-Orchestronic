import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RequestModule } from './request/request.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseModule } from './database/database.module';
import { UserController } from './user/user.controller';
import { UserModule } from './user/user.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { RepositoriesModule } from './repositories/repositories.module';
import { RepositoriesController } from './repositories/repositories.controller';
import { RepositoriesService } from './repositories/repositories.service';
import { AuthModule } from './auth/auth.module';
import { ResourceModule } from './resource/resource.module';
import { AirflowService } from './airflow/airflow.service';
import { AirflowController } from './airflow/airflow.controller';
import { RabbitmqService } from './rabbitmq/rabbitmq.service';
import { RabbitmqController } from './rabbitmq/rabbitmq.controller';
import { RabbitmqModule } from './rabbitmq/rabbitmq.module';
import { AirflowModule } from './airflow/airflow.module';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { CloudModule } from './cloud/cloud.module';
import { HttpModule } from '@nestjs/axios';
import { GitlabModule } from './gitlab/gitlab.module';
import { ScheduleModule } from '@nestjs/schedule';
import { CloudProvidersModule } from './cloud-providers/cloud-providers.module';
import { AzurePolicyModule } from './azure-policy/azure-policy.module';
import { AzurePolicyController } from './azure-policy/azure-policy.controller';
import { AzurePolicyService } from './azure-policy/azure-policy.service';
import { AwsPolicyModule } from './aws-policy/aws-policy.module';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { ProjectRequestModule } from './request/project/project-request.module';
import { ProjectRequestController } from './request/project/project-request.controller';
import { K8sAutomationModule } from './k8sautomation/k8sautomation.module';
import { K8sAutomationService } from './k8sautomation/k8sautomation.service';
import { ElasticsearchModule } from './elasticsearch/elasticsearch.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    HttpModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        baseURL:
          config.get<string>('AIRFLOW_BASE_URL') ?? 'http://localhost:8080',
        auth: {
          username: config.get<string>('AIRFLOW_USERNAME') ?? '',
          password: config.get<string>('AIRFLOW_PASSWORD') ?? '',
        },
        timeout: 15000,
      }),
    }),

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
      }
    ]),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'swagger-static'),
      serveRoot: process.env.NODE_ENV === 'development' ? '/' : '/swagger',
    }),
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.POSTGRES_HOST,
      port: parseInt(<string>process.env.POSTGRES_PORT),
      username: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DATABASE,
      autoLoadEntities: true,
      synchronize: true,
    }),
    ScheduleModule.forRoot(),
    RequestModule,
    DatabaseModule,
    UserModule,
    RepositoriesModule,
    ResourceModule,
    AuthModule,
    RabbitmqModule,
    AirflowModule,
    CloudModule,
    AzurePolicyModule,
    GitlabModule,
    CloudProvidersModule,
    AwsPolicyModule,
    InfrastructureModule,
    ProjectRequestModule,
    K8sAutomationModule,
    ElasticsearchModule,
  ],
  controllers: [
    AppController,
    UserController,
    RepositoriesController,
    AirflowController,
    RabbitmqController,
    AzurePolicyController,
  ],
  providers: [
    // { provide: APP_GUARD, useClass: JwtAuthGuard },
    AppService,
    RepositoriesService,
    AirflowService,
    RabbitmqService,
    AzurePolicyService,
    K8sAutomationService,
  ],
})
export class AppModule {}
