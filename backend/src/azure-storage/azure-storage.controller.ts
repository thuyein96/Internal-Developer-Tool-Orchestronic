import { Controller, Get, Query, Param } from '@nestjs/common';
import { AzureStorageService } from './azure-storage.service';

@Controller('azure-storage')
export class AzureStorageController {
  constructor(private readonly azureStorageService: AzureStorageService) {}

  // Get logs for specific run_id across the 3 hardcoded DAGs
  @Get('airflow/cluster-logs-by-run-id')
  async getLogsForSpecificRunAcrossDags(@Query('runId') runId?: string) {
    if (!runId) {
      return {
        error: 'runId is required',
        message:
          'Please provide a runId query parameter (e.g., ?runId=manual__2026-01-06T14:14:06.514503+00:00)',
        example: 'manual__2026-01-06T14:14:06.514503+00:00',
      };
    }

    const logs =
      await this.azureStorageService.getLogsForSpecificRunAcrossDags(runId);

    return {
      runId,
      dagIds: [
        'AWS_Resources_Cluster',
        'AWS_terraform_k3s_provision',
        'AWS_configure_k3s',
      ],
      dags: logs,
      totalDags: logs.length,
      totalLogs: logs.reduce((sum, dag) => sum + dag.logs.length, 0),
    };
  }

  // Debug endpoint: List actual blob paths for a DAG
  @Get('airflow/debug/dag/:dagId/blobs')
  async listBlobsForDag(
    @Param('dagId') dagId: string,
    @Query('limit') limit?: string,
  ) {
    const maxBlobs = limit ? parseInt(limit) : 20;
    const blobs = await this.azureStorageService.listBlobsForDag(
      dagId,
      maxBlobs,
    );
    return {
      dagId,
      count: blobs.length,
      blobs,
    };
  }
}
