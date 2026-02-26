import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  Status,
  Role,
  CloudProvider,
  RepositoryStatus,
  Resources,
} from '@prisma/client';
import { DatabaseService } from '../database/database.service';
import { CreateAzureRequestDto } from './dto/create-request-azure.dto';
import { ApiBody } from '@nestjs/swagger';
import { BackendJwtPayload } from '../lib/types';
import { RabbitmqService } from '../rabbitmq/rabbitmq.service';
import { AirflowService } from '../airflow/airflow.service';
import { RequestStatus } from './dto/request-status.dto';
import { CreateAwsRequestDto } from './dto/create-request-aws.dto';
import { GitlabService } from '../gitlab/gitlab.service';

@Injectable()
export class RequestService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly rabbitmqService: RabbitmqService,
    private readonly airflowService: AirflowService,
    private readonly gitlabService: GitlabService,
  ) {}

  async findAll(user: BackendJwtPayload) {
    const whereClause =
      user.role === Role.Admin || user.role === Role.IT
        ? {}
        : { ownerId: user.id };

    return await this.databaseService.request.findMany({
      where: whereClause,
      select: {
        id: true,
        displayCode: true,
        createdAt: true,
        status: true,
        owner: {
          select: {
            id: true,
            name: true,
          },
        },
        resources: {
          select: {
            id: true,
            name: true,
          },
        },
        repository: {
          select: {
            id: true,
            name: true,
            RepositoryCollaborator: {
              select: {
                userId: true,
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    gitlabUrl: true,
                    gitlabId: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async findByStatus(status: Status) {
    return await this.databaseService.request.findMany({
      where: { status },
    });
  }

  async findById(id: number) {
    return await this.databaseService.request.findUnique({
      where: { id: id.toString() },
    });
  }

  @ApiBody({ type: CreateAzureRequestDto })
  async createRequestAzure(
    dto: CreateAzureRequestDto,
    user: BackendJwtPayload,
  ) {
    const { repository, resources, ...request } = dto;
    const ownerId = user.id;

    const ownerInDb = await this.databaseService.user.findUnique({
      where: { id: ownerId },
      select: { id: true },
    });

    if (!ownerInDb) {
      throw new BadRequestException('Authenticated user not found in database');
    }

    // Check repository name uniqueness
    const existingRepo = await this.databaseService.repository.findUnique({
      where: { name: repository.name },
    });
    if (existingRepo)
      throw new ConflictException('Repository name already exists');

    // Verify collaborators exist
    const collaboratorIds =
      repository.collaborators?.map((c) => c.userId) || [];

    const collaboratorsInDb = await this.databaseService.user.findMany({
      where: { id: { in: collaboratorIds } },
      select: { id: true },
    });

    if (collaboratorsInDb.length !== collaboratorIds.length) {
      throw new BadRequestException('One or more collaborators not found');
    }

    let newResource: Resources | null = null;
    if (dto.resources) {
      // Create resourceConfig with VMs, DBs, STs
      const resourceConfig = await this.databaseService.resourceConfig.create({
        data: {
          AzureVMInstance: {
            create: (resources.resourceConfig.vms || []).map((vm) => ({
              name: vm.name,
              numberOfCores: vm.numberOfCores,
              memory: vm.memory,
              os: vm.os,
              sizeId: vm.sizeId,
            })),
          },
          AzureDatabase: {
            create: resources.resourceConfig.dbs || [],
          },
          AzureStorage: {
            create: resources.resourceConfig.sts || [],
          },
        },
      });

      // Create Resources linked to resourceConfig
      newResource = await this.databaseService.resources.create({
        data: {
          name: resources.name,
          cloudProvider: resources.cloudProvider as CloudProvider,
          region: resources.region,
          resourceConfig: { connect: { id: resourceConfig.id } },
        },
      });
    }

    // Create Repository with collaborators (using userId)
    const newRepository = await this.databaseService.repository.create({
      data: {
        name: repository.name,
        description: repository.description,
        resources: newResource
          ? { connect: { id: newResource.id } }
          : undefined,
        RepositoryCollaborator: {
          create:
            repository.collaborators?.map((c) => ({
              userId: c.userId,
              gitlabUserId: c.gitlabUserId,
            })) || [],
        },
      },
    });

    // Generate displayCode for Request
    const lastRequest = await this.databaseService.request.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { displayCode: true },
    });
    const lastNumber = lastRequest
      ? parseInt(lastRequest.displayCode.split('-')[1])
      : 0;
    const displayCode = `R-${lastNumber + 1}`;

    // Create Request linking owner, repository, resources
    const newRequest = await this.databaseService.request.create({
      data: {
        description: request.description,
        displayCode,
        owner: { connect: { id: ownerId } },
        repository: { connect: { id: newRepository.id } },
        resources: newResource
          ? { connect: { id: newResource.id } }
          : undefined,
      },
      include: {
        resources: {
          include: {
            resourceConfig: {
              include: {
                AzureVMInstance: true,
                AzureDatabase: true,
                AzureStorage: true,
                AzureK8sCluster: true,
              },
            },
          },
        },
        repository: true,
        owner: true,
      },
    });

    return newRequest;
  }

  @ApiBody({ type: CreateAwsRequestDto })
  async createRequestAws(dto: CreateAwsRequestDto, user: BackendJwtPayload) {
    const { repository, resources, ...request } = dto;
    const ownerId = user.id;

    const ownerInDb = await this.databaseService.user.findUnique({
      where: { id: ownerId },
      select: { id: true },
    });

    if (!ownerInDb) {
      throw new BadRequestException('Authenticated user not found in database');
    }

    // Check repository name uniqueness
    const existingRepo = await this.databaseService.repository.findUnique({
      where: { name: repository.name },
    });
    if (existingRepo)
      throw new ConflictException('Repository name already exists');

    // Verify collaborators exist
    const collaboratorIds =
      repository.collaborators?.map((c) => c.userId) || [];

    const collaboratorsInDb = await this.databaseService.user.findMany({
      where: { id: { in: collaboratorIds } },
      select: { id: true },
    });

    if (collaboratorsInDb.length !== collaboratorIds.length) {
      throw new BadRequestException('One or more collaborators not found');
    }

    // Create resourceConfig with VMs, DBs, STs
    const resourceConfig = await this.databaseService.resourceConfig.create({
      data: {
        AwsVMInstance: {
          create: (resources.resourceConfig.vms || []).map((vm) => ({
            instanceName: vm.instanceName,
            os: vm.os,
            keyName: vm.keyName,
            sgName: vm.sgName,
            awsInstanceTypeId: vm.awsInstanceTypeId,
          })),
        },
        AwsDatabase: {
          create: resources.resourceConfig.dbs || [],
        },
        AwsStorage: {
          create: resources.resourceConfig.sts || [],
        },
      },
    });

    // Create Resources linked to resourceConfig
    const newResource = await this.databaseService.resources.create({
      data: {
        name: resources.name,
        cloudProvider: resources.cloudProvider as CloudProvider,
        region: resources.region,
        resourceConfig: { connect: { id: resourceConfig.id } },
      },
    });

    // Create Repository with collaborators (using userId)
    const newRepository = await this.databaseService.repository.create({
      data: {
        name: repository.name,
        description: repository.description,
        resources: { connect: { id: newResource.id } },
        RepositoryCollaborator: {
          create:
            repository.collaborators?.map((c) => ({
              userId: c.userId,
              gitlabUserId: c.gitlabUserId,
            })) || [],
        },
      },
    });

    // Generate displayCode for Request
    const lastRequest = await this.databaseService.request.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { displayCode: true },
    });
    const lastNumber = lastRequest
      ? parseInt(lastRequest.displayCode.split('-')[1])
      : 0;
    const displayCode = `R-${lastNumber + 1}`;

    // Create Request linking owner, repository, resources
    const newRequest = await this.databaseService.request.create({
      data: {
        description: request.description,
        displayCode,
        owner: { connect: { id: ownerId } },
        repository: { connect: { id: newRepository.id } },
        resources: { connect: { id: newResource.id } },
      },
      include: {
        resources: {
          include: {
            resourceConfig: {
              include: {
                AwsVMInstance: true,
                AwsDatabase: true,
                AwsStorage: true,
              },
            },
          },
        },
        repository: true,
        owner: true,
      },
    });

    return newRequest;
  }

  async updateRequestInfo(
    user: BackendJwtPayload,
    id: string,
    status: RequestStatus,
  ) {
    // 1️⃣ Update request status first
    const updateStatus = await this.databaseService.request.update({
      where: { id },
      data: { status },
      include: {
        repository: true,
        owner: true,
      },
    });

    // 2️⃣ If not approved → stop here
    if (updateStatus.status !== RequestStatus.Approved) {
      return updateStatus;
    }

    // 3️⃣ Fetch resourcesId
    const requestEntry = await this.databaseService.request.findUniqueOrThrow({
      where: { id },
      select: { resourcesId: true },
    });

    // 4️⃣ Get repository + collaborators (with gitlabUserId!)
    const repository = await this.databaseService.repository.findUniqueOrThrow({
      where: { id: updateStatus.repository.id },
      select: {
        name: true,
        description: true,
        RepositoryCollaborator: {
          select: {
            gitlabUserId: true,
            userId: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                gitlabId: true,
                gitlabUrl: true,
              },
            },
          },
        },
      },
    });

    // 5️⃣ Get owner's GitLab username
    const gitlabOwner = await this.databaseService.user.findUniqueOrThrow({
      where: { id: updateStatus.owner.id },
      select: { gitlabName: true },
    });

    // 6️⃣ Create GitLab project under owner namespace
    await this.gitlabService.createProjectForAUser(
      gitlabOwner.gitlabName ?? '',
      {
        name: repository.name,
        description: repository.description ?? '',
      },
    );

    // 7️⃣ Fetch created GitLab project to get its ID
    const project = await this.gitlabService.getProjectByName(repository.name);
    if (!project) {
      throw new Error(
        `GitLab project not found after creation: ${repository.name}`,
      );
    }

    const projectId = project.id;

    // 8️⃣ Invite collaborators (gitlabUserId OR fallback to user.gitlabId)
    for (const collaborator of repository.RepositoryCollaborator) {
      const gitlabId =
        collaborator.gitlabUserId && collaborator.gitlabUserId > 0
          ? collaborator.gitlabUserId
          : collaborator.user.gitlabId;

      if (!gitlabId || gitlabId <= 0) {
        console.warn(
          `Skipping collaborator ${collaborator.userId} — invalid GitLab ID (gitlabUserId=${collaborator.gitlabUserId}, user.gitlabId=${collaborator.user.gitlabId})`,
        );
        continue;
      }

      await this.gitlabService.inviteUserToProject(projectId, gitlabId);
    }

    // 9️⃣ Update repository status → Created
    await this.databaseService.repository.update({
      where: { id: updateStatus.repository.id },
      data: { status: RepositoryStatus.Created },
    });

    if (
      requestEntry.resourcesId !== null &&
      requestEntry.resourcesId !== undefined
    ) {
      // 🔟 Fetch cloud provider
      const resourceInfo =
        await this.databaseService.resources.findUniqueOrThrow({
          where: { id: requestEntry.resourcesId },
          select: { cloudProvider: true },
        });

      const cloudProvider = resourceInfo.cloudProvider;

      // 1️⃣1️⃣ Trigger CI/CD + cloud provisioning
      // Send request ID to RabbitMQ first, then trigger Airflow
      // to avoid race condition where Airflow starts before the ID is available
      if (cloudProvider === CloudProvider.AWS) {
        await this.rabbitmqService.queueRequest(id);
        await new Promise(resolve => setTimeout(resolve, 2000)); // 1 second delay
        await this.airflowService.triggerDag(user, 'AWS_Resources');
      } else if (cloudProvider === CloudProvider.AZURE) {
        await this.rabbitmqService.queueRequest(id);
        await new Promise(resolve => setTimeout(resolve, 2000)); // 1 second delay
        await this.airflowService.triggerDag(user, 'AZURE_Resource_Group');
      } else {
        throw new Error(`Unsupported cloudProvider: ${cloudProvider}`);
      }
    }

    return updateStatus;
  }

  async updateRequestFeedback(id: string, feedback?: string) {
    return this.databaseService.request.update({
      where: { id },
      data: { feedback: feedback || null },
    });
  }

  async findWithRequestDisplayCode(
    displayCode: string,
    user: BackendJwtPayload,
  ) {
    const whereClause =
      user.role === Role.Admin || user.role === Role.IT
        ? { displayCode }
        : { displayCode, ownerId: user.id };
    const request = await this.databaseService.request.findUnique({
      where: whereClause,
      include: {
        resources: {
          include: {
            resourceConfig: {
              include: {
                AzureVMInstance: {
                  include: {
                    size: true,
                  },
                },
                AzureDatabase: true,
                AzureStorage: true,
                AwsVMInstance: {
                  include: {
                    AwsInstanceType: true,
                  },
                },
                AwsDatabase: {
                  include: { dbInstanceClass: true },
                },
                AwsStorage: true,
              },
            },
          },
        },
        repository: {
          select: {
            id: true,
            name: true,
            status: true,
            RepositoryCollaborator: {
              include: {
                user: true,
              },
            },
          },
        },
        owner: true,
      },
    });

    if (!request) {
      throw new NotFoundException('Request not found or has been deleted');
    }

    return request;
  }

  async removeRequest(id: string) {
    return this.databaseService.request.delete({
      where: { id: id },
    });
  }

  async getVmSizes() {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return await (this.databaseService as any).azureVMSize.findMany();
    } catch (error) {
      console.error('Error fetching VM sizes:', error);
      throw new InternalServerErrorException('Failed to fetch VM sizes');
    }
  }

  async getVmSizesPaginated(params: {
    page?: number;
    limit?: number;
    search?: string;
    minCores?: number;
    maxCores?: number;
    minMemory?: number;
    maxMemory?: number;
  }) {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        minCores,
        maxCores,
        minMemory,
        maxMemory,
      } = params;

      // Build the where clause for filtering
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const where: any = {};

      if (search) {
        where.name = {
          contains: search,
          mode: 'insensitive',
        };
      }

      if (minCores !== undefined || maxCores !== undefined) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const coresFilter: any = {};
        if (minCores !== undefined) {
          coresFilter.gte = Number(minCores);
        }
        if (maxCores !== undefined) {
          coresFilter.lte = Number(maxCores);
        }
        where.numberOfCores = coresFilter;
      }

      if (minMemory !== undefined || maxMemory !== undefined) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const memoryFilter: any = {};
        if (minMemory !== undefined) {
          memoryFilter.gte = Number(minMemory);
        }
        if (maxMemory !== undefined) {
          memoryFilter.lte = Number(maxMemory);
        }
        where.memoryInMB = memoryFilter;
      }

      // Calculate offset
      const skip = (page - 1) * limit;

      // Get total count for pagination
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const total = await (this.databaseService as any).azureVMSize.count({
        where,
      });

      // Get paginated data
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = await (this.databaseService as any).azureVMSize.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: [
          { numberOfCores: 'asc' },
          { memoryInMB: 'asc' },
          { name: 'asc' },
        ],
      });

      // Calculate pagination metadata
      const totalPages = Math.ceil(total / limit);
      const hasNext = page < totalPages;
      const hasPrev = page > 1;

      return {
        data,
        meta: {
          total,
          page,
          limit,
          totalPages,
          hasNext,
          hasPrev,
        },
      };
    } catch (error) {
      console.error('Error fetching VM sizes:', error);
      throw new InternalServerErrorException('Failed to fetch VM sizes');
    }
  }
}
