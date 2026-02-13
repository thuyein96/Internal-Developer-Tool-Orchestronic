// src/airflow/airflow.module.ts
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AirflowService } from './airflow.service';
import { AirflowController } from './airflow.controller';

@Module({
  imports: [HttpModule],
  controllers: [AirflowController],
  providers: [AirflowService],
  exports: [AirflowService],
})
export class AirflowModule {}
