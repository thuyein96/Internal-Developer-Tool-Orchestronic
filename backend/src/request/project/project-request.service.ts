import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { AirflowService } from '../../airflow/airflow.service';
import { DatabaseService } from '../../database/database.service';
import { GitlabService } from '../../gitlab/gitlab.service';
import { BackendJwtPayload, RequestWithCookies } from '../../lib/types';
import { RabbitmqService } from '../../rabbitmq/rabbitmq.service';
import { CreateClusterRequestDto } from './dto/request/create-cluster-request.dto';
import { parse as parseYaml } from 'yaml';
import { ApiBody } from '@nestjs/swagger';
import {
  AwsK8sCluster,
  CloudProvider,
  deployStatus,
  Status,
} from '@prisma/client';
import { CreateProjectRequestDto } from './dto/request/create-project-request.dto';
import { AddRepositoryToK8sClusterDto } from './dto/request/update-repository.dto';
import { AzureK8sClusterDto } from './dto/response/cluster-response-azure.dto';
import { NewClusterDto } from './dto/response/new-cluster-azure.dto';
import { K8sAutomationService } from '../../k8sautomation/k8sautomation.service';
import { CreateClusterDeploymentRequestDto } from '../../k8sautomation/dto/request/create-deploy-request.dto';
import { CloudflareService } from '../../cloudflare/cloudflare.service';
import { UserClustersPayloadDto } from './dto/response/get-cluster-by-user-id-response.dto';
import { CreateClusterAzureResponseDto } from './dto/response/create-cluster-azure-response.dto';
import { UpdateClusterRequestStatusDto } from './dto/request/update-cluster.dto';
import { AwsK8sClusterDto } from './dto/response/cluster-response-aws.dto';
import * as crypto from 'crypto';
import { en } from '@faker-js/faker/.';
import cluster from 'cluster';
import { KubeConfig } from './dto/request/kubeconfig';

@Injectable()
export class ProjectRequestService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly rabbitmqService: RabbitmqService,
    private readonly airflowService: AirflowService,
    private readonly gitlabService: GitlabService,
    private readonly k8sAutomationService: K8sAutomationService,
    private readonly cloudflareService: CloudflareService,
  ) {}

  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async waitForClusterDagConsumerTask(
    dagId: string,
    dagRunId: string,
    timeoutMs = 20000,
    pollIntervalMs = 1000,
  ): Promise<'success' | 'failed' | 'timeout'> {
    const startedAt = Date.now();

    while (Date.now() - startedAt < timeoutMs) {
      try {
        const tasks = await this.airflowService.getTaskInstances(dagId, dagRunId);
        const consumerTask = (tasks ?? []).find(
          (task: any) => task?.task_id === 'get_resource_id',
        );

        if (!consumerTask) {
          await this.sleep(pollIntervalMs);
          continue;
        }

        const state = consumerTask.state as string | undefined;

        if (state === 'success') return 'success';

        if (
          state === 'failed' ||
          state === 'upstream_failed' ||
          state === 'removed'
        ) {
          return 'failed';
        }

        // Let Airflow retrying/scheduling states continue.
        await this.sleep(pollIntervalMs);
        continue;
      } catch {
        // DAG run/task instances may not be visible immediately after trigger.
        await this.sleep(pollIntervalMs);
      }
    }

    return 'timeout';
  }

  private async triggerClusterProvisionDagWithRetry(
    user: BackendJwtPayload,
    dagId: string,
    resourceId: string,
    maxAttempts = 3,
  ) {
    let lastError: unknown;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        this.rabbitmqService.queueResource(resourceId);

        // Add jitter to reduce simultaneous consumers colliding on the shared queue.
        const jitterMs = 300 + Math.floor(Math.random() * 1200);
        await this.sleep(jitterMs);

        const dagRun = await this.airflowService.triggerDag(user, dagId);
        const dagRunId = dagRun?.dag_run_id;

        if (!dagRunId) {
          throw new BadRequestException(
            `Airflow trigger succeeded without dag_run_id for ${dagId}`,
          );
        }

        const consumerTaskState = await this.waitForClusterDagConsumerTask(
          dagId,
          dagRunId,
        );

        if (consumerTaskState === 'success') {
          return dagRun;
        }

        if (consumerTaskState === 'timeout') {
          // Do not retrigger aggressively if Airflow is slow; preserve the in-flight run.
          return dagRun;
        }

        throw new BadRequestException(
          `Airflow consumer task get_resource_id failed for ${dagId} (attempt ${attempt}/${maxAttempts})`,
        );
      } catch (error) {
        lastError = error;
        if (attempt === maxAttempts) break;

        // Backoff before requeue + retrigger.
        const backoffMs = attempt * 1000 + Math.floor(Math.random() * 1000);
        await this.sleep(backoffMs);
      }
    }

    throw lastError;
  }

  // async createProjectRequest(
  //   user: BackendJwtPayload,
  //   request: CreateProjectRequestDto
  // ) {

  //   try {
  //     const ownerId = user.id;
  //     const ownerInDb = await this.databaseService.user.findUnique({
  //       where: { id: ownerId },
  //       select: { id: true },
  //     });
  //     const { repository } = request;
  //     if (!ownerInDb) {
  //       throw new BadRequestException('Authenticated user not found in database');
  //     }

  //     const existingRepo = await this.databaseService.repository.findUnique({
  //       where: { name: repository.name },
  //     });

  //     if (existingRepo)
  //       throw new ConflictException('Repository name already exists');

  //     const newRepository = await this.databaseService.repository.create({
  //       data: {
  //         name: repository.name,
  //         description: repository.description,
  //         RepositoryCollaborator: {
  //           create:
  //             repository.collaborators?.map((c) => ({
  //               userId: c.userId,
  //               gitlabUserId: c.gitlabUserId,
  //             })) || [],
  //         },
  //       },
  //     });

  //     if(!newRepository) {
  //       throw new BadRequestException('Failed to create repository');
  //     }

  //     const gitlabOwner = await this.databaseService.user.findUniqueOrThrow({
  //       where: { id: ownerId },
  //       select: { gitlabName: true },
  //     });

  //     await this.gitlabService.createProjectForAUser(
  //       gitlabOwner.gitlabName ?? '',
  //       {
  //         name: repository.name,
  //         description: repository.description ?? '',
  //       },
  //     );

  //     const lastRequest = await this.databaseService.request.findFirst({
  //       orderBy: { createdAt: 'desc' },
  //       select: { displayCode: true },
  //     });
  //     const lastNumber = lastRequest
  //       ? parseInt(lastRequest.displayCode.split('-')[1])
  //       : 0;
  //     const displayCode = `P-${lastNumber + 1}`;

  //     const projectRequest = await this.databaseService.request.create({
  //       data: {
  //         description: request.description,
  //         displayCode,
  //         owner: { connect: { id: ownerId } },
  //         repository: { connect: { id: newRepository.id } },
  //       },
  //       include: {
  //         repository: true,
  //         owner: true,
  //       },
  //     })

  //     if(!projectRequest) {
  //       throw new BadRequestException('Failed to create project request');
  //     }

  //     // map projectRequest to ProjectRequestDto
  //     const response: ProjectRequestDto = {
  //       id: projectRequest.id,
  //       displayCode: projectRequest.displayCode,
  //       description: projectRequest.description,
  //       status: projectRequest.status,
  //       repositoryId: projectRequest.repositoryId,
  //       azureK8sClusterId: projectRequest.repository?.azureK8sClusterId ?? undefined,
  //       awsK8sClusterId: projectRequest.repository?.awsK8sClusterId ?? undefined,
  //       ownerId: projectRequest.ownerId,
  //       resourceId: projectRequest.resourcesId ?? undefined,
  //       feedback: projectRequest.feedback ?? '',
  //     };

  //     return response;
  //   } catch(error) {
  //     throw new Error('Failed to create project request');
  //   }
  // }

  @ApiBody({ type: CreateClusterRequestDto })
  async createCluster(
    user: BackendJwtPayload,
    request: CreateClusterRequestDto,
  ) {
    const ownerId = user.id;
    const resources = request.resources;
    const provider = (
      resources.cloudProvider || ''
    ).toUpperCase() as CloudProvider;
    const ownerInDb = await this.databaseService.user.findUnique({
      where: { id: ownerId },
      select: { id: true },
    });

    if (!ownerInDb) {
      throw new BadRequestException('Authenticated user not found in database');
    }

    if (provider == CloudProvider.AZURE) {
      const resourceConfig = await this.databaseService.resourceConfig.create({
        data: {
          AzureK8sCluster: {
            create: resources.resourceConfig.cluster || [],
          },
        },
      });

      const newResource = await this.databaseService.resources.create({
        data: {
          name: resources.name,
          cloudProvider: provider,
          region: resources.region,
          resourceConfig: { connect: { id: resourceConfig.id } },
        },
      });

      return await this.databaseService.clusterRequest.create({
        data: {
          ownerId: ownerInDb.id,
          resourceId: newResource.id,
        },
      });
    }

    if (provider == CloudProvider.AWS) {
      const resourceConfig = await this.databaseService.resourceConfig.create({
        data: {
          AwsK8sCluster: {
            create: resources.resourceConfig.cluster || [],
          },
        },
      });

      const newResource = await this.databaseService.resources.create({
        data: {
          name: resources.name,
          cloudProvider: provider,
          region: resources.region,
          resourceConfig: { connect: { id: resourceConfig.id } },
        },
      });

      return await this.databaseService.clusterRequest.create({
        data: {
          ownerId: ownerInDb.id,
          resourceId: newResource.id,
        },
      });
    }

    // const updatedClusterRequest = await this.databaseService.request.update({
    //   where: { id: request.requestId },
    //   data: {
    //     resources: { connect: { id: newResource.id } },
    //   },
    //   include: {
    //     resources: true,
    //     repository: true,
    //   },
    // });

    // if (!updatedClusterRequest) {
    //   throw new BadRequestException(
    //     'Failed to update cluster request with resources',
    //   );
    // }

    // reuse that in patch route later
    // await Promise.all([
    //   this.rabbitmqService.queueResource(newResource.id),
    //   this.airflowService.triggerDag(user, 'AZURE_Resource_Group_Cluster'),
    // ]);

    // // Cannot retrieve cluster ID here, will be updated after workflow is done
    // const clusterResponse = new CreateClusterAzureResponseDto();
    // clusterResponse.statuscode = 201;

    // const newClusterDto = new NewClusterDto();
    // newClusterDto.resourceId = newResource.id;
    // clusterResponse.message = newClusterDto;

    // return clusterResponse;
  }

  async updateClusterRequestStatus(
    user: BackendJwtPayload,
    updateClusterDto: UpdateClusterRequestStatusDto,
  ) {
    const clusterRequest = await this.databaseService.clusterRequest.findUnique(
      {
        where: { id: updateClusterDto.clusterRequestId },
      },
    );

    if (!clusterRequest) {
      throw new BadRequestException('Cluster request not found');
    }

    const resource = await this.databaseService.resources.findUnique({
      where: { id: clusterRequest.resourceId },
    });

    if (!resource) {
      throw new BadRequestException(
        'Resource not found for the cluster request',
      );
    }

    // update status first
    await this.databaseService.clusterRequest.update({
      where: { id: clusterRequest.id },
      data: { status: updateClusterDto.status },
    });

    if (
      updateClusterDto.status === Status.Approved &&
      resource.cloudProvider === CloudProvider.AZURE
    ) {
      await this.triggerClusterProvisionDagWithRetry(
        user,
        'AZURE_Resource_Group_Cluster',
        clusterRequest.resourceId,
      );
    }

    if (
      updateClusterDto.status === Status.Approved &&
      resource.cloudProvider === CloudProvider.AWS
    ) {
      await this.triggerClusterProvisionDagWithRetry(
        user,
        'AWS_Resources_Cluster',
        clusterRequest.resourceId,
      );
    }

    const clusterResponse = new CreateClusterAzureResponseDto();
    clusterResponse.statuscode = 201;

    const newClusterDto = new NewClusterDto();
    newClusterDto.clusterReqId = clusterRequest.id;
    clusterResponse.message = newClusterDto;

    return clusterResponse;
  }

  async findClusterByUserId(user: BackendJwtPayload) {
    const awsClusters = await this.databaseService.awsK8sCluster.findMany({
      where: {
        resourceConfig: { resources: { request: { ownerId: user.id } } },
      },
      include: { resourceConfig: { include: { resources: true } } },
    });

    const azureClusters = await this.databaseService.azureK8sCluster.findMany({
      where: {
        resourceConfig: { resources: { request: { ownerId: user.id } } },
      },
      include: { resourceConfig: { include: { resources: true } } },
    });

    if (
      (!awsClusters || awsClusters.length === 0) &&
      (!azureClusters || azureClusters.length === 0)
    ) {
      throw new BadRequestException('No clusters found for user');
    }

    return {
      awsClusters,
      azureClusters,
    } as UserClustersPayloadDto;
  }

  async findClusterById(clusterId: string, provider: CloudProvider) {
    if (provider === CloudProvider.AWS) {
      const response = await this.databaseService.awsK8sCluster.findUnique({
        where: { id: clusterId },
        select: {
          clusterName: true,
          nodeCount: true,
          nodeSize: true,
          kubeConfig: true,
          clusterEndpoint: true,
          terraformState: true,
          resourceConfigId: true,
        },
      });

      if (!response) return null;

      const cluster: AwsK8sClusterDto = {
        id: clusterId,
        clusterName: response.clusterName,
        nodeCount: response.nodeCount,
        nodeSize: response.nodeSize,
        resourceConfigId: response.resourceConfigId,
        ...(response.kubeConfig
          ? { kubeConfig: JSON.stringify(response.kubeConfig) }
          : {}),
        ...(response.clusterEndpoint
          ? { clusterEndpoint: JSON.stringify(response.clusterEndpoint) }
          : {}),
        ...(response.terraformState
          ? { terraformState: JSON.stringify(response.terraformState) }
          : {}),
      };

      return cluster;
    }

    if (provider === CloudProvider.AZURE) {
      const response = await this.databaseService.azureK8sCluster.findUnique({
        where: { id: clusterId },
        select: {
          clusterName: true,
          nodeCount: true,
          nodeSize: true,
          kubeConfig: true,
          clusterFqdn: true,
          terraformState: true,
          resourceConfigId: true,
        },
      });

      if (!response) return null;

      const cluster: AzureK8sClusterDto = {
        id: clusterId,
        clusterName: response.clusterName,
        nodeCount: response.nodeCount,
        nodeSize: response.nodeSize,
        resourceConfigId: response.resourceConfigId,
        ...(response.kubeConfig
          ? { kubeConfig: JSON.stringify(response.kubeConfig) }
          : {}),
        ...(response.clusterFqdn
          ? { clusterFqdn: JSON.stringify(response.clusterFqdn) }
          : {}),
        ...(response.terraformState
          ? { terraformState: JSON.stringify(response.terraformState) }
          : {}),
      };

      return cluster;
    }
    return null;
  }

  async DeployToK8sCluster(request: AddRepositoryToK8sClusterDto) {
    try {
      console.log(
        'DeployToK8sCluster called with request:',
        JSON.stringify(request, null, 2),
      );

      // Check if repository exists
      const repository = await this.databaseService.repository.findUnique({
        where: { id: request.repositoryId },
      });

      if (!repository) {
        throw new BadRequestException('Repository not found');
      }

      // Get image from gitlab
      const project = await this.gitlabService.getProjectByName(
        repository.name,
      );
      if (!project) {
        throw new BadRequestException('Project not found in GitLab');
      }

      let projectDetail;
      try {
        projectDetail = await this.gitlabService.getImageFromRegistry(
          project.id,
        );
      } catch (error) {
        console.error('Error getting image from GitLab registry:', error);
        throw new BadRequestException(
          `Failed to get image from GitLab registry: ${error.message}`,
        );
      }

      if (!projectDetail || !projectDetail.name || !projectDetail.image) {
        throw new BadRequestException('No image found in GitLab registry');
      }

      let host = '';
      // Get chosen cluster
      if (request.provider === CloudProvider.AZURE) {
        try {
          const cluster = await this.databaseService.azureK8sCluster.findUnique(
            {
              where: { id: request.clusterId },
            },
          );

          if (!cluster) {
            throw new BadRequestException('Azure K8s Cluster not found');
          }

          if (!cluster.kubeConfig) {
            throw new BadRequestException('Kubeconfig not found in cluster');
          }

          const kubeConfig = this.kubeconfigYamlToTypedObject(
            cluster.kubeConfig,
          );

          // Register DNS record with Cloudflare
          const clusterIp = cluster.clusterFqdn; // Extract the public IP from cluster FQDN
          
          if (!clusterIp) {
            console.warn(`Cluster ${cluster.clusterName} has no FQDN/IP, skipping DNS registration`);
          } else {
            const clusterName = cluster.clusterName.trim().replace(/['"]/g, ''); // Remove any quotes
            const wildcardDomain = `*.${clusterName}.orchestronic.dev`;
            console.log(`Registering DNS: ${wildcardDomain} -> ${clusterIp}`);
            try {
              const dnsResult = await this.cloudflareService.upsertARecord({
                fqdn: wildcardDomain,
                ip: clusterIp,
                proxied: false,
                ttl: 1,
              });
            
            if (dnsResult.action === 'created') {
              console.log(`DNS record created for ${wildcardDomain} -> ${clusterIp}`);
            } else if (dnsResult.action === 'updated') {
              console.log(`DNS record updated for ${wildcardDomain} -> ${clusterIp}`);
            } else {
              console.log(`DNS record unchanged for ${wildcardDomain}`);
            }
            } catch (error) {
              console.error('Failed to register DNS record with Cloudflare:', error);
              // Continue with deployment even if DNS registration fails
            }
          }

          // TODO: add kubeconfig to k8s automation service by cluster id
          host = `${repository.name}.${cluster.clusterName}.orchestronic.dev`;
          // Deploy into cluster
          const deploymentRequest = new CreateClusterDeploymentRequestDto();
          deploymentRequest.name = repository.name;
          deploymentRequest.host = host;
          deploymentRequest.image = projectDetail.image;
          deploymentRequest.port = request.port;
          deploymentRequest.usePrivateRegistry =
            request.usePrivateRegistry ?? false;
          deploymentRequest.kubeConfig = kubeConfig;

          console.log('Deployment Request:', deploymentRequest);
          const deploymentResponse =
            await this.k8sAutomationService.automateK8sDeployment(
              deploymentRequest,
            );
          if (!deploymentResponse || !deploymentResponse.success) {
            console.error(
              'Azure deployment failed:',
              deploymentResponse?.message,
            );
            throw new BadRequestException(
              'Failed to deploy to Azure K8s Cluster',
            );
          }

          // Add resource to repository
          const resourceConfig =
            await this.databaseService.resourceConfig.findUnique({
              where: { id: cluster.resourceConfigId },
            });
          if (!resourceConfig) {
            throw new BadRequestException('Resource config not found');
          }

          const resource = await this.databaseService.resources.findFirst({
            where: { resourceConfigId: resourceConfig.id },
          });
          if (!resource) {
            throw new BadRequestException('Resource not found');
          }

          // Note: Not linking resourcesId directly to repository for K8s deployments
          // as multiple repositories can share the same cluster resource.
          // The ImageDeployment table properly tracks the repository-cluster relationship.

          await this.databaseService.imageDeployment.create({
            data: {
              repositoryId: request.repositoryId,
              AzureK8sClusterId: cluster.id,
              hostedUrl: host,
              imageUrl: projectDetail.image, // Add the appropriate image URL
              DeploymentStatus: deployStatus.Deployed,
            },
          });

          return host;
        } catch (error) {
          console.error('Error deploying to Azure K8s Cluster:', error);
          console.error('Error stack:', error.stack);
          throw new BadRequestException(
            `Failed to deploy to Azure K8s Cluster: ${error.message}`,
          );
        }
      }

      if (request.provider === CloudProvider.AWS) {
        try {
          console.log('Deploying to AWS K8s Cluster', request.clusterId);
          const cluster = await this.databaseService.awsK8sCluster.findUnique({
            where: { id: request.clusterId },
          });

          if (!cluster) {
            throw new BadRequestException('AWS K8s Cluster not found');
          }
          if (!cluster.kubeConfig) {
            throw new BadRequestException('Kubeconfig not found in cluster');
          }

          const clusterEndpoint = cluster.clusterEndpoint;
          if (!clusterEndpoint) {
            throw new BadRequestException(
              'Cluster endpoint not found in cluster',
            );
          }
          const parsedEndpoint = JSON.parse(clusterEndpoint);

          if (!parsedEndpoint.edge_public_ip) {
            throw new BadRequestException(
              'Edge public IP not found in cluster endpoint',
            );
          }
          // Register DNS record with Cloudflare
          const clusterIp = parsedEndpoint.edge_public_ip;
          const clusterName = cluster.clusterName.trim().replace(/['"]/g, ''); // Remove any quotes
          const wildcardDomain = `*.${clusterName}.orchestronic.dev`;
          console.log(`Registering DNS: ${wildcardDomain} -> ${clusterIp}`);
          try {
            const dnsResult = await this.cloudflareService.upsertARecord({
              fqdn: wildcardDomain,
              ip: clusterIp,
              proxied: false,
              ttl: 1,
            });
            
            if (dnsResult.action === 'created') {
              console.log(`DNS record created for ${wildcardDomain} -> ${clusterIp}`);
            } else if (dnsResult.action === 'updated') {
              console.log(`DNS record updated for ${wildcardDomain} -> ${clusterIp}`);
            } else {
              console.log(`DNS record unchanged for ${wildcardDomain}`);
            }
          } catch (error) {
            console.error('Failed to register DNS record with Cloudflare:', error);
            // Continue with deployment even if DNS registration fails
          }

          // TODO: add kubeconfig to k8s automation service by cluster id
          const kubeConfigObject = this.kubeconfigYamlToTypedObject(
            cluster.kubeConfig,
          );
          host = `${repository.name}.${clusterName}.orchestronic.dev`;
          // Deploy into cluster
          const deploymentRequest = new CreateClusterDeploymentRequestDto();
          deploymentRequest.name = repository.name;
          deploymentRequest.host = host;
          deploymentRequest.image = projectDetail.image;
          deploymentRequest.port = request.port;
          deploymentRequest.usePrivateRegistry =
            request.usePrivateRegistry ?? false;
          deploymentRequest.kubeConfig = kubeConfigObject;

          console.log('Deployment Request:', deploymentRequest);
          const deploymentResponse =
            await this.k8sAutomationService.automateK8sDeployment(
              deploymentRequest,
            );
          if (!deploymentResponse || !deploymentResponse.success) {
            console.error(
              'AWS deployment failed:',
              deploymentResponse?.message,
            );
            throw new BadRequestException(
              'Failed to deploy to AWS K8s Cluster',
            );
          }

          // Add resource to repository
          const resourceConfig =
            await this.databaseService.resourceConfig.findUnique({
              where: { id: cluster.resourceConfigId },
            });
          if (!resourceConfig) {
            throw new BadRequestException('Resource config not found');
          }

          const resource = await this.databaseService.resources.findFirst({
            where: { resourceConfigId: resourceConfig.id },
          });
          if (!resource) {
            throw new BadRequestException('Resource not found');
          }

          // Note: Not linking resourcesId directly to repository for K8s deployments
          // as multiple repositories can share the same cluster resource.
          // The ImageDeployment table properly tracks the repository-cluster relationship.

          await this.databaseService.imageDeployment.create({
            data: {
              repositoryId: request.repositoryId,
              AwsK8sClusterId: cluster.id,
              hostedUrl: host,
              imageUrl: projectDetail.image, // Add the appropriate image URL
              DeploymentStatus: deployStatus.Deployed,
            },
          });

          return host;
        } catch (error) {
          console.error('Error deploying to AWS K8s Cluster:', error);
          console.error('Error stack:', error.stack);
          throw new BadRequestException(
            `Failed to deploy to AWS K8s Cluster: ${error.message}`,
          );
        }
      }
    } catch (error) {
      console.error('=== DeployToK8sCluster Error ===');
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      console.error(
        'Full error:',
        JSON.stringify(error, Object.getOwnPropertyNames(error), 2),
      );
      console.error('================================');
      throw error;
    }
  }

  async updateDeployToAzureCluster() {}

  async findClustersByUserId(req: BackendJwtPayload) {
    const clusterRequests = await this.databaseService.clusterRequest.findMany({
      where: {
        ownerId: req.id,
      },
    });

    const resourceIds = clusterRequests.map((cr) => cr.resourceId);

    const resources = await this.databaseService.resources.findMany({
      where: {
        id: { in: resourceIds },
      },
    });

    const resourceConfigIds = resources
      .map((r) => r.resourceConfigId)
      .filter(Boolean) as string[];

    const [awsClusters, azureClusters] = await Promise.all([
      this.databaseService.awsK8sCluster.findMany({
        where: { resourceConfigId: { in: resourceConfigIds } },
      }),
      this.databaseService.azureK8sCluster.findMany({
        where: { resourceConfigId: { in: resourceConfigIds } },
      }),
    ]);

    const awsByConfigId = new Map<string, any>();
    for (const c of awsClusters) {
      if (!awsByConfigId.has(c.resourceConfigId)) awsByConfigId.set(c.resourceConfigId, c);
    }
    const azureByConfigId = new Map<string, any>();
    for (const c of azureClusters) {
      if (!azureByConfigId.has(c.resourceConfigId)) azureByConfigId.set(c.resourceConfigId, c);
    }

    return resources.map((resource) => {
      const firstCluster =
        (resource.cloudProvider === CloudProvider.AWS
          ? awsByConfigId.get(resource.resourceConfigId)
          : azureByConfigId.get(resource.resourceConfigId)) || null;
      return {
        clusterRequestId: resource.id,
        id: firstCluster?.id || '',
        name: firstCluster?.clusterName || '',
        region: resource.region,
        resourceConfigId: resource.resourceConfigId,
        cloudProvider: resource.cloudProvider,
      };
    });
  }

  async findClustersByUserIdAndStatus(req: BackendJwtPayload, status: Status) {
    const clusterRequests = await this.databaseService.clusterRequest.findMany({
      where: {
        ownerId: req.id,
        status: status,
      },
    });

    const resourceIds = clusterRequests.map((cr) => cr.resourceId);

    const resources = await this.databaseService.resources.findMany({
      where: {
        id: { in: resourceIds },
      },
    });

    return resources;
  }

  async findAllPendingClusters() {
    const clusterRequests = await this.databaseService.clusterRequest.findMany({
      where: {
        status: Status.Pending,
      },
    });

    const resourceIds = clusterRequests.map((cr) => cr.resourceId);

    const resources = await this.databaseService.resources.findMany({
      where: {
        id: { in: resourceIds },
      },
    });

    return clusterRequests.map((cr) => ({
      clusterRequestId: cr.id,
      ...resources.find((r) => r.id === cr.resourceId),
    }));
  }

  async findAllApprovedClusters() {
    const clusterRequests = await this.databaseService.clusterRequest.findMany({
      where: {
        status: Status.Approved,
      },
    });

    const resourceIds = clusterRequests.map((cr) => cr.resourceId);

    const resources = await this.databaseService.resources.findMany({
      where: {
        id: { in: resourceIds },
      },
    });

    const resourceConfigIds = resources
      .map((r) => r.resourceConfigId)
      .filter(Boolean) as string[];

    const [awsClusters, azureClusters] = await Promise.all([
      this.databaseService.awsK8sCluster.findMany({
        where: { resourceConfigId: { in: resourceConfigIds } },
      }),
      this.databaseService.azureK8sCluster.findMany({
        where: { resourceConfigId: { in: resourceConfigIds } },
      }),
    ]);

    const awsByConfigId = new Map<string, any>();
    for (const c of awsClusters) {
      if (!awsByConfigId.has(c.resourceConfigId)) awsByConfigId.set(c.resourceConfigId, c);
    }
    const azureByConfigId = new Map<string, any>();
    for (const c of azureClusters) {
      if (!azureByConfigId.has(c.resourceConfigId)) azureByConfigId.set(c.resourceConfigId, c);
    }

    return resources.map((resource) => {
      const firstCluster =
        (resource.cloudProvider === CloudProvider.AWS
          ? awsByConfigId.get(resource.resourceConfigId)
          : azureByConfigId.get(resource.resourceConfigId)) || null;
      return {
        clusterRequestId: resource.id,
        id: firstCluster?.id || '',
        name: firstCluster?.clusterName || '',
        region: resource.region,
        resourceConfigId: resource.resourceConfigId,
        cloudProvider: resource.cloudProvider,
      };
    });
  }

  async findAllApprovedClustersByUserId(req: BackendJwtPayload) {
    const clusterRequests = await this.databaseService.clusterRequest.findMany({
      where: {
        ownerId: req.id,
        status: Status.Approved,
      },
    });

    const resourceIds = clusterRequests.map((cr) => cr.resourceId);

    const resources = await this.databaseService.resources.findMany({
      where: {
        id: { in: resourceIds },
      },
    });

    const resourceConfigIds = resources
      .map((r) => r.resourceConfigId)
      .filter(Boolean) as string[];

    const [awsClusters, azureClusters] = await Promise.all([
      this.databaseService.awsK8sCluster.findMany({
        where: { resourceConfigId: { in: resourceConfigIds } },
      }),
      this.databaseService.azureK8sCluster.findMany({
        where: { resourceConfigId: { in: resourceConfigIds } },
      }),
    ]);

    const awsByConfigId = new Map<string, any>();
    for (const c of awsClusters) {
      if (!awsByConfigId.has(c.resourceConfigId)) awsByConfigId.set(c.resourceConfigId, c);
    }
    const azureByConfigId = new Map<string, any>();
    for (const c of azureClusters) {
      if (!azureByConfigId.has(c.resourceConfigId)) azureByConfigId.set(c.resourceConfigId, c);
    }

    return resources.map((resource) => {
      const firstCluster =
        (resource.cloudProvider === CloudProvider.AWS
          ? awsByConfigId.get(resource.resourceConfigId)
          : azureByConfigId.get(resource.resourceConfigId)) || null;
      return {
        clusterRequestId: resource.id,
        id: firstCluster?.id || '',
        name: firstCluster?.clusterName || '',
        region: resource.region,
        resourceConfigId: resource.resourceConfigId,
        cloudProvider: resource.cloudProvider,
      };
    });
  }

  async findAllClustersWithStatus(status: Status) {
    const clusterRequests = await this.databaseService.clusterRequest.findMany({
      where: {
        status: status,
      },
    });

    const resourceIds = clusterRequests.map((cr) => cr.resourceId);

    const resources = await this.databaseService.resources.findMany({
      where: {
        id: { in: resourceIds },
      },
    });

    return clusterRequests.map((cr) => ({
      clusterRequestId: cr.id,
      ...resources.find((r) => r.id === cr.resourceId),
    }));
  }

  async findClusterResourcesById(clusterId: string) {
    const resource = await this.databaseService.resources.findUnique({
      where: { id: clusterId },
    });

    if (!resource) {
      throw new BadRequestException('Resource not found');
    }

    return resource;
  }

  async findClusterResourceConfigById(clusterId: string) {
    const resource = await this.databaseService.resources.findUnique({
      where: { id: clusterId },
    });

    if (resource?.cloudProvider === CloudProvider.AWS) {
      const resourceConfig =
        await this.databaseService.resourceConfig.findUnique({
          where: { id: resource?.resourceConfigId },
        });

      const cluster = await this.databaseService.awsK8sCluster.findMany({
        where: { resourceConfigId: resourceConfig?.id },
      });

      if (!cluster) {
        throw new BadRequestException('Resource config not found');
      }

      return cluster;
    }

    if (resource?.cloudProvider === CloudProvider.AZURE) {
      const resourceConfig =
        await this.databaseService.resourceConfig.findUnique({
          where: { id: resource?.resourceConfigId },
        });

      const cluster = await this.databaseService.azureK8sCluster.findMany({
        where: { resourceConfigId: resourceConfig?.id },
      });

      if (!cluster) {
        throw new BadRequestException('Resource config not found');
      }

      return cluster;
    }
  }

  async findClusterRequestsByReqId(requestId: string) {
    const clusterRequest = await this.databaseService.clusterRequest.findUnique(
      {
        where: { id: requestId },
      },
    );

    if (!clusterRequest) {
      throw new BadRequestException('Cluster request not found');
    }

    return clusterRequest;
  }

  async findAllClusterRequests() {
    const clusterRequests =
      await this.databaseService.clusterRequest.findMany();

    if (!clusterRequests || clusterRequests.length === 0) {
      throw new BadRequestException('No cluster requests found');
    }

    return clusterRequests;
  }

  async findResourceConfigById(resourceConfigId: string) {
    const resourceConfig = await this.databaseService.resourceConfig.findMany({
      where: { id: resourceConfigId },
    });

    if (!resourceConfig) {
      throw new BadRequestException('Resource config not found');
    }

    return resourceConfig;
  }

  async findImageDeploymentsByRepoId(repositoryId: string) {
    const imageDeployments =
      await this.databaseService.imageDeployment.findFirst({
        where: { repositoryId: repositoryId },
      });

    if (!imageDeployments) {
      throw new BadRequestException('No image deployments found');
    }
    return imageDeployments;
  }

  private kubeconfigYamlToTypedObject(yamlText: string): KubeConfig {
    return parseYaml(yamlText) as KubeConfig;
  }
}