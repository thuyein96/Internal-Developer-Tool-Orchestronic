import { Injectable } from '@nestjs/common';
import { CreateInfrastructureDto } from './dto/create-infrastructure.dto';
import { UpdateInfrastructureDto } from './dto/update-infrastructure.dto';
import { DatabaseService } from '../database/database.service';
import { RabbitmqService } from '../rabbitmq/rabbitmq.service';
import { AirflowService } from '../airflow/airflow.service';
import { CloudProvider } from '@prisma/client';
import { BackendJwtPayload } from '../lib/types';
import { GitlabService } from '../gitlab/gitlab.service';

@Injectable()
export class InfrastructureService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly rabbitmqService: RabbitmqService,
    private readonly airflowService: AirflowService,
    private readonly gitlabService: GitlabService,
  ) {}

  create(createInfrastructureDto: CreateInfrastructureDto) {
    return 'This action adds a new infrastructure';
  }

  async findAll() {
    // Requests summary
    const totalRequests = await this.databaseService.request.count();
    const approvedRequests = await this.databaseService.request.count({
      where: { status: 'Approved' },
    });
    const declinedRequests = await this.databaseService.request.count({
      where: { status: 'Rejected' },
    });
    const pendingRequests = await this.databaseService.request.count({
      where: { status: 'Pending' },
    });

    // Resource groups
    const totalResourceGroupsAWS = await this.databaseService.resources.count({
      where: {
        cloudProvider: CloudProvider.AWS,
        request: { status: 'Approved' },
      },
    });
    const totalResourceGroupsAzure = await this.databaseService.resources.count(
      {
        where: {
          cloudProvider: CloudProvider.AZURE,
          request: { status: 'Approved' },
        },
      },
    );

    // VM summary
    const totalAzureVMs = await this.databaseService.request.count({
      where: {
        status: 'Approved',
        resources: { cloudProvider: CloudProvider.AZURE },
      },
    });
    const totalAwsVMs = await this.databaseService.request.count({
      where: {
        status: 'Approved',
        resources: { cloudProvider: CloudProvider.AWS },
      },
    });
    // Example: running/pending status (if you have a status field)
    // const runningAzureVMs = await this.databaseService.azureVMInstance.count({ where: { status: 'Running' } });
    // const pendingAzureVMs = await this.databaseService.azureVMInstance.count({ where: { status: 'Pending' } });

    // DB summary
    const totalAzureDBs =
      await this.databaseService.azureDatabaseInstance.count();
    const totalAwsDBs = await this.databaseService.awsDatabaseInstance.count();

    // Storage summary
    const totalAzureSTs =
      await this.databaseService.azureStorageInstance.count();
    const totalAwsSTs = await this.databaseService.awsStorageInstance.count();

    // Add more as needed (e.g., by region, by owner, etc.)

    return {
      requests: {
        total: totalRequests,
        approved: approvedRequests,
        declined: declinedRequests,
        pending: pendingRequests,
      },
      totalResourceGroupsAWS: totalResourceGroupsAWS,
      totalResourceGroupsAzure: totalResourceGroupsAzure,
      vms: {
        azure: totalAzureVMs,
        aws: totalAwsVMs,
        // runningAzure: runningAzureVMs,
        // pendingAzure: pendingAzureVMs,
      },
      dbs: {
        azure: totalAzureDBs,
        aws: totalAwsDBs,
      },
      storage: {
        azure: totalAzureSTs,
        aws: totalAwsSTs,
      },
      // Add more fields for other infrastructure metrics as needed
    };
  }

  findOne(id: number) {
    return `This action returns a #${id} infrastructure`;
  }

  update(id: number, updateInfrastructureDto: UpdateInfrastructureDto) {
    return `This action updates a #${id} infrastructure`;
  }

  async infrastrutureDestroy(user: BackendJwtPayload, id: string) {
    const request = await this.databaseService.request.findFirst({
      where: { id: id },
      select: {
        resourcesId: true,
        repository: true,
      },
    });

    // const gitlabRepoId: Array<{ id: number; name: string; path: string }> =
    //   await this.gitlabService.findOne(request?.repository.name || '');

    // const gitlabRepo = gitlabRepoId.find(
    //   (repo) =>
    //     repo.id &&
    //     repo.name === request?.repository.name &&
    //     repo.path === request?.repository.name,
    // );

    // if (
    //   gitlabRepo?.id &&
    //   gitlabRepo?.name === request?.repository.name &&
    //   gitlabRepo?.path === request?.repository.name
    // ) {
    //   console.log(`Deleting GitLab repo with ID: ${gitlabRepo?.id}`);
    //   await this.gitlabService.remove(gitlabRepo?.id);
    // }

    if (!request?.resourcesId) {
      throw new Error(`No resourcesId found for request ${id}`);
    }

    const result = await this.databaseService.resources.findFirst({
      where: { id: request?.resourcesId },
      select: {
        cloudProvider: true,
      },
    });

    const cloudProvider = result?.cloudProvider;

    if (!cloudProvider) {
      throw new Error(
        `No cloudProvider found for resourcesId ${request?.resourcesId}`,
      );
    }

    if (cloudProvider === CloudProvider.AWS) {
      this.rabbitmqService.destroyRequest(id.toString());
      this.airflowService.triggerDag(user, 'AWS_Destroy');
    } else if (cloudProvider == CloudProvider.AZURE) {
      this.rabbitmqService.destroyRequest(id.toString());
      this.airflowService.triggerDag(user, 'AZURE_Destroy');
    } else {
      throw new Error(`Unsupported cloudProvider: ${cloudProvider}`);
    }

    return `This action destroys ${cloudProvider} resources for request #${id}`;
  }

  remove(id: number) {
    return `This action removes a #${id} infrastructure`;
  }
}
