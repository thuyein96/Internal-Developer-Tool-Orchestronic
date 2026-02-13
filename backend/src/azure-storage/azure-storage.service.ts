import { Injectable } from '@nestjs/common';
import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';

@Injectable()
export class AzureStorageService {
  private blobServiceClient: BlobServiceClient;
  private containerClient: ContainerClient;

  constructor() {
    const connectionString = process.env.AZURE_BLOB_STORAGE_CONNECTION_STRING;
    const containerName = process.env.CONTAINER_NAME;

    if (!connectionString || !containerName) {
      throw new Error(
        'Azure Blob Storage connection string or container name is not configured',
      );
    }

    this.blobServiceClient =
      BlobServiceClient.fromConnectionString(connectionString);
    this.containerClient =
      this.blobServiceClient.getContainerClient(containerName);
  }

  // Get logs for specific DAGs with a given run_id
  async getLogsForSpecificRunAcrossDags(runId: string): Promise<
    Array<{
      dagId: string;
      dagName: string;
      runExists: boolean;
      runId: string;
      timestamp: Date;
      formattedDate: string;
      logs: Array<{
        taskId: string;
        attempt: number;
        log: string;
        blobPath: string;
      }>;
    }>
  > {
    // Hardcoded AWS K3s cluster DAGs
    const targetDags = [
      'AWS_Resources_Cluster',
      'AWS_terraform_k3s_provision',
      'AWS_configure_k3s',
    ];

    const dagNames: Record<string, string> = {
      AWS_Resources_Cluster: 'AWS Resources Cluster',
      AWS_terraform_k3s_provision: 'AWS Terraform K3s Provision',
      AWS_configure_k3s: 'AWS Configure K3s',
    };

    const results: Array<{
      dagId: string;
      dagName: string;
      runExists: boolean;
      runId: string;
      timestamp: Date;
      formattedDate: string;
      logs: Array<{
        taskId: string;
        attempt: number;
        log: string;
        blobPath: string;
      }>;
    }> = [];

    for (const dagId of targetDags) {
      const logs: Array<{
        taskId: string;
        attempt: number;
        log: string;
        blobPath: string;
      }> = [];
      let hasLogs = false;

      try {
        // Try exact match first
        const prefix = `dag_id=${dagId}/run_id=${runId}/`;
        console.log(`\n=== Searching DAG: ${dagId} ===`);
        console.log(`Prefix (exact): ${prefix}`);

        let foundWithExactMatch = false;
        for await (const blob of this.containerClient.listBlobsFlat({
          prefix,
        })) {
          console.log(`Found blob (exact match): ${blob.name}`);
          foundWithExactMatch = true;
          hasLogs = true;

          const match = blob.name.match(/task_id=([^/]+)\/attempt=(\d+)\.log$/);
          if (match) {
            const taskId = match[1];
            const attempt = parseInt(match[2]);

            try {
              console.log(`Downloading: ${blob.name}`);
              const blockBlobClient = this.containerClient.getBlockBlobClient(
                blob.name,
              );
              const downloadResponse = await blockBlobClient.download();

              if (downloadResponse.readableStreamBody) {
                const buffer = await this.streamToBuffer(
                  downloadResponse.readableStreamBody,
                );
                const logContent = buffer.toString('utf-8');

                logs.push({
                  taskId,
                  attempt,
                  log: logContent,
                  blobPath: blob.name,
                });
                console.log(`✓ Downloaded: ${taskId} (${buffer.length} bytes)`);
              } else {
                logs.push({
                  taskId,
                  attempt,
                  log: `ERROR: No readable stream available`,
                  blobPath: blob.name,
                });
              }
            } catch (downloadError) {
              console.error(`✗ Download failed:`, downloadError.message);
              logs.push({
                taskId,
                attempt,
                log: `ERROR: ${downloadError.message}`,
                blobPath: blob.name,
              });
            }
          }
        }

        // If no exact match, try broader search
        if (!foundWithExactMatch) {
          console.log(`No exact match found. Trying broader search...`);
          const dagPrefix = `dag_id=${dagId}/`;

          for await (const blob of this.containerClient.listBlobsFlat({
            prefix: dagPrefix,
          })) {
            // Check if this blob contains the runId
            if (blob.name.includes(runId)) {
              console.log(`Found blob (broad match): ${blob.name}`);
              hasLogs = true;

              const match = blob.name.match(
                /task_id=([^/]+)\/attempt=(\d+)\.log$/,
              );
              if (match) {
                const taskId = match[1];
                const attempt = parseInt(match[2]);

                try {
                  const blockBlobClient =
                    this.containerClient.getBlockBlobClient(blob.name);
                  const downloadResponse = await blockBlobClient.download();

                  if (downloadResponse.readableStreamBody) {
                    const buffer = await this.streamToBuffer(
                      downloadResponse.readableStreamBody,
                    );
                    const logContent = buffer.toString('utf-8');

                    logs.push({
                      taskId,
                      attempt,
                      log: logContent,
                      blobPath: blob.name,
                    });
                    console.log(
                      `✓ Downloaded: ${taskId} (${buffer.length} bytes)`,
                    );
                  }
                } catch (downloadError) {
                  console.error(`✗ Download failed:`, downloadError.message);
                }
              }
            }
          }
        }

        if (!hasLogs) {
          console.log(`❌ No logs found for ${dagId} with runId: ${runId}`);
        }

        results.push({
          dagId,
          dagName: dagNames[dagId] || dagId,
          runExists: hasLogs,
          runId,
          timestamp: this.parseRunIdToDate(runId),
          formattedDate: hasLogs
            ? this.formatDate(this.parseRunIdToDate(runId))
            : 'N/A',
          logs,
        });

        console.log(
          `${dagId}: Found ${logs.length} logs (runExists: ${hasLogs})`,
        );
      } catch (error) {
        console.error(`✗ Error processing DAG ${dagId}:`, error);
        results.push({
          dagId,
          dagName: dagNames[dagId] || dagId,
          runExists: false,
          runId,
          timestamp: this.parseRunIdToDate(runId),
          formattedDate: 'Error',
          logs: [
            {
              taskId: 'error',
              attempt: 0,
              log: `ERROR: ${error.message}`,
              blobPath: 'N/A',
            },
          ],
        });
      }
    }

    return results;
  }

  // Debug method: List actual blob paths for a DAG
  async listBlobsForDag(
    dagId: string,
    maxBlobs: number = 20,
  ): Promise<string[]> {
    const blobs: string[] = [];
    const prefix = `dag_id=${dagId}/`;
    let count = 0;

    for await (const blob of this.containerClient.listBlobsFlat({ prefix })) {
      blobs.push(blob.name);
      count++;
      if (count >= maxBlobs) break;
    }

    return blobs;
  }

  // Helper to parse run_id timestamp
  private parseRunIdToDate(runId: string): Date {
    // Extract timestamp from run_id format: manual__2026-01-06T14:14:06.514503+00:00
    const match = runId.match(
      /(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/,
    );
    if (match) {
      const [, year, month, day, hour, minute, second] = match;
      return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}Z`);
    }
    return new Date(0);
  }

  // Helper to format date
  private formatDate(date: Date): string {
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    const month = months[date.getMonth()];
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${month} ${day}, ${year} ${hours}:${minutes}`;
  }

  private async streamToBuffer(
    readableStream: NodeJS.ReadableStream,
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      readableStream.on('data', (data) => {
        chunks.push(data instanceof Buffer ? data : Buffer.from(data));
      });
      readableStream.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
      readableStream.on('error', reject);
    });
  }
}
