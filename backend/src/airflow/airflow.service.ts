import {
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { BackendJwtPayload } from '../lib/types';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AirflowService {
  constructor(private readonly httpService: HttpService) {}

  private airflowBaseUrl() {
    return process.env.AIRFLOW_BASE_URL ?? 'http://localhost:8080/airflow';
  }

  private airflowAuth() {
    return {
      username: process.env.AIRFLOW_USERNAME ?? 'airflow',
      password: process.env.AIRFLOW_PASSWORD ?? 'airflow',
    };
  }

  async triggerDag(user: BackendJwtPayload, dagId: string) {
    if (
      user.role === 'Admin' ||
      user.role === 'IT' ||
      user.role === 'Developer'
    ) {
      const path = `/api/v1/dags/${encodeURIComponent(dagId)}/dagRuns`;
      const payload = { conf: {} };

      try {
        const response$ = this.httpService.post(
          `${process.env.AIRFLOW_BASE_URL ?? 'http://localhost:8080/airflow'}${path}`,
          payload,
          {
            auth: {
              username: process.env.AIRFLOW_USERNAME ?? 'airflow',
              password: process.env.AIRFLOW_PASSWORD ?? 'airflow',
            },
            headers: { 'Content-Type': 'application/json' },
          },
        );

        const resp = await firstValueFrom(response$);

        // this.getTaskInstances(resp.data.dag_id, resp.data.dag_run_id);
        return resp.data;
      } catch (err: any) {
        console.log(err);
        throw new HttpException(
          {
            message: 'Failed to trigger Airflow DAG',
            details: err?.response?.data ?? err?.message ?? 'Unknown error',
          },
          err?.response?.status ?? HttpStatus.BAD_GATEWAY,
        );
      }
    } else {
      throw new UnauthorizedException(
        'You do not have permission to trigger DAGs',
      );
    }
  }

  async getTaskInstances(dagId: string, dagRunId: string) {
    const path = `/api/v1/dags/${dagId}/dagRuns/${dagRunId}/taskInstances`;

    try {
      const response$ = this.httpService.get(
        `${process.env.AIRFLOW_BASE_URL ?? 'http://localhost:8080/airflow'}${path}`,
        {
          auth: {
            username: process.env.AIRFLOW_USERNAME ?? 'airflow',
            password: process.env.AIRFLOW_PASSWORD ?? 'airflow',
          },
          headers: { 'Content-Type': 'application/json' },
        },
      );

      const resp = await firstValueFrom(response$);
      return resp.data.task_instances;
    } catch (err: any) {
      throw new HttpException(
        {
          message: 'Failed to fetch task instances',
          details: err?.response?.data ?? err?.message ?? 'Unknown error',
        },
        err?.response?.status ?? HttpStatus.BAD_GATEWAY,
      );
    }
  }

  async getTaskLogs(
    dagId: string,
    dagRunId: string,
    taskId: string,
    tryNumber = 1,
  ) {
    const path = `/api/v1/dags/${dagId}/dagRuns/${dagRunId}/taskInstances/${taskId}/logs/${tryNumber}`;
    console.log(path);

    try {
      const response$ = this.httpService.get(
        `${process.env.AIRFLOW_BASE_URL ?? 'http://localhost:8080/airflow'}${path}`,
        {
          auth: {
            username: process.env.AIRFLOW_USERNAME ?? 'airflow',
            password: process.env.AIRFLOW_PASSWORD ?? 'airflow',
          },
          headers: { 'Content-Type': 'application/json' },
        },
      );

      const resp = await firstValueFrom(response$);
      return resp.data?.content ?? resp.data;
    } catch (err: any) {
      return `Error fetching logs for task ${taskId}: ${err?.message ?? 'Unknown error'}`;
    }
  }

  async getWorkerLogs() {
    const path = '/api/v1/eventLogs';

    try {
      const response$ = this.httpService.get(
        `${process.env.AIRFLOW_BASE_URL ?? 'http://localhost:8080/airflow'}${path}`,
        {
          auth: {
            username: process.env.AIRFLOW_USERNAME ?? 'airflow',
            password: process.env.AIRFLOW_PASSWORD ?? 'airflow',
          },
          headers: { 'Content-Type': 'application/json' },
          params: {
            limit: 100,
            order_by: '-when',
          },
        },
      );

      const resp = await firstValueFrom(response$);
      return resp.data;
    } catch (err: any) {
      throw new HttpException(
        {
          message: 'Failed to fetch worker logs',
          details: err?.response?.data ?? err?.message ?? 'Unknown error',
        },
        err?.response?.status ?? HttpStatus.BAD_GATEWAY,
      );
    }
  }

  async getAllDags(limit = 100, offset = 0) {
    const path = `/api/v1/dags`;

    try {
      const response$ = this.httpService.get(
        `${process.env.AIRFLOW_BASE_URL ?? 'http://localhost:8080/airflow'}${path}`,
        {
          auth: {
            username: process.env.AIRFLOW_USERNAME ?? 'airflow',
            password: process.env.AIRFLOW_PASSWORD ?? 'airflow',
          },
          headers: { 'Content-Type': 'application/json' },
          params: {
            limit,
            offset,
          },
        },
      );

      const resp = await firstValueFrom(response$);

      return resp.data;
    } catch (err: any) {
      throw new HttpException(
        {
          message: 'Failed to fetch DAGs',
          details: err?.response?.data ?? err?.message ?? 'Unknown error',
        },
        err?.response?.status ?? HttpStatus.BAD_GATEWAY,
      );
    }
  }

  async getLatestDagRunId(dagId: string): Promise<string | null> {
    const path = `/api/v1/dags/${encodeURIComponent(dagId)}/dagRuns`;

    const resp = await firstValueFrom(
      this.httpService.get(`${this.airflowBaseUrl()}${path}`, {
        auth: this.airflowAuth(),
        headers: { 'Content-Type': 'application/json' },
        params: {
          limit: 1,
          order_by: '-execution_date',
        },
      }),
    );

    return resp.data?.dag_runs?.[0]?.dag_run_id ?? null;
  }

  async getTaskInstanceById(dagId: string, dagRunId: string, taskId: string) {
    const path =
      `/api/v1/dags/${encodeURIComponent(dagId)}` +
      `/dagRuns/${encodeURIComponent(dagRunId)}` +
      `/taskInstances/${encodeURIComponent(taskId)}`;

    const resp = await firstValueFrom(
      this.httpService.get(`${this.airflowBaseUrl()}${path}`, {
        auth: this.airflowAuth(),
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    return resp.data;
  }

  async getTaskLogsSafe(
    dagId: string,
    dagRunId: string,
    taskId: string,
    tryNumber: number,
  ) {
    const path =
      `/api/v1/dags/${encodeURIComponent(dagId)}` +
      `/dagRuns/${encodeURIComponent(dagRunId)}` +
      `/taskInstances/${encodeURIComponent(taskId)}` +
      `/logs/${tryNumber}`;

    try {
      const resp = await firstValueFrom(
        this.httpService.get(`${this.airflowBaseUrl()}${path}`, {
          auth: this.airflowAuth(),
          headers: { 'Content-Type': 'application/json' },
          params: {
            full_content: true, // avoids truncation
          },
        }),
      );

      return resp.data?.content ?? resp.data;
    } catch (err: any) {
      return `Error fetching logs: ${err?.response?.data ?? err?.message ?? 'Unknown error'}`;
    }
  }

  async getLogsForTasksInLatestRun(dagId: string, taskIds: string[]) {
    const dagRunId = await this.getLatestDagRunId(dagId);
    if (!dagRunId) {
      return {
        dagId,
        dagRunId: null,
        tasks: taskIds.map((t) => ({ taskId: t, error: 'No dag runs found' })),
      };
    }

    const tasks = await Promise.all(
      taskIds.map(async (taskId) => {
        const ti = await this.getTaskInstanceById(
          dagId,
          dagRunId,
          taskId,
        ).catch(() => null);

        const tryNumber = ti?.try_number ?? 1;
        const state = ti?.state ?? null;

        const log = await this.getTaskLogsSafe(
          dagId,
          dagRunId,
          taskId,
          tryNumber,
        );

        return { taskId, state, tryNumber, log };
      }),
    );

    return { dagId, dagRunId, tasks };
  }

  async getOrchestronicSelectedLogs() {
    return {
      AWS_Resources_Cluster: await this.getLogsForTasksInLatestRun(
        'AWS_Resources_Cluster',
        ['terraform_apply', 'end'],
      ),

      AWS_terraform_k3s_provision: await this.getLogsForTasksInLatestRun(
        'AWS_terraform_k3s_provision',
        ['terraform_init', 'terraform_apply', 'trigger_k3s_configuration'],
      ),

      AWS_configure_k3s: await this.getLogsForTasksInLatestRun(
        'AWS_configure_k3s',
        ['fetch_cluster_info', 'configure_clusters', 'store_kubeconfigs'],
      ),
    };
  }
}
