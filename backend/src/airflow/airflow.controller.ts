import {
  Controller,
  Post,
  Request,
  UnauthorizedException,
  Param,
  Get,
  Query,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { AirflowService } from './airflow.service';
import { BackendJwtPayload } from '../lib/types';
import { RequestWithCookies } from '../lib/types';
import * as jwt from 'jsonwebtoken';

@Controller('airflow')
export class AirflowController {
  constructor(private readonly airflowService: AirflowService) {}

  @Post(':dagId/dagRuns')
  @ApiOperation({
    summary: 'Trigger a new DAG run',
    description:
      'Triggers a specified Airflow DAG with the provided configuration.',
  })
  triggerDag(
    @Request() req: RequestWithCookies,
    @Param('dagId') dagId: string,
  ) {
    const token = req.cookies?.['access_token'];
    if (token === undefined) {
      throw new UnauthorizedException('No access token');
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET not defined');
    }

    try {
      const decoded = jwt.verify(token, secret) as unknown;
      const payload = decoded as BackendJwtPayload;
      return this.airflowService.triggerDag(payload, dagId);
    } catch (error) {
      throw new UnauthorizedException('Invalid token - unable to process');
    }
  }

  @Get(':dagId/:dagRunId/logs')
  async getPipelineLogs(
    @Param('dagId') dagId: string,
    @Param('dagRunId') dagRunId: string,
  ) {
    try {
      const tasks = await this.airflowService.getTaskInstances(dagId, dagRunId);

      if (!tasks || tasks.length === 0) {
        return {
          logs: '',
          taskId: null,
          message: 'No tasks found for this DAG run',
        };
      }

      // Try to find a failed task first
      const failedTask = tasks.find((t) => t.state === 'failed');

      // Otherwise pick running / queued / last
      const targetTask =
        failedTask ||
        tasks.find((t) => t.state === 'running') ||
        tasks.find((t) => t.state === 'queued') ||
        tasks[tasks.length - 1];

      const taskId = targetTask.task_id;

      // Fetch logs for that task
      const logs = await this.airflowService.getTaskLogs(
        dagId,
        dagRunId,
        taskId,
      );

      return { logs, taskId };
    } catch (err) {
      console.error('Failed to fetch logs:', err);
      return { logs: '', taskId: null, error: err.message || 'Unknown error' };
    }
  }

  @Get(':dagId/:dagRunId/task-instances')
  getTaskInstances(
    @Param('dagId') dagId: string,
    @Param('dagRunId') dagRunId: string,
  ) {
    return this.airflowService.getTaskInstances(dagId, dagRunId);
  }

  @Get('worker/logs')
  @ApiOperation({
    summary: 'Get Airflow worker logs',
    description:
      'Fetches event logs from Airflow workers showing system events and task execution history.',
  })
  getWorkerLogs() {
    return this.airflowService.getWorkerLogs();
  }

  @Get('/airflow/dags')
  getDags(@Query('limit') limit?: string, @Query('offset') offset?: string) {
    return this.airflowService.getAllDags(
      Number(limit ?? 100),
      Number(offset ?? 0),
    );
  }

  @Get('cluster-creation/logs')
  async getOrchestronicLogs() {
    return this.airflowService.getOrchestronicSelectedLogs();
  }
}
