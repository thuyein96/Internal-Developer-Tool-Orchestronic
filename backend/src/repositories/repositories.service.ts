import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateAzureRepositoriesDto } from './dto/create-azure-repository.dto';
import { BackendJwtPayload } from '../lib/types';
import { CloudProvider, RepositoryStatus, Role } from '@prisma/client';
import { CreateAwsRepositoriesDto } from './dto/create-aws-repository.dto';

@Injectable()
export class RepositoriesService {
  constructor(private readonly databaseService: DatabaseService) {}

  async updateRepository(id: string, status: RepositoryStatus) {
    return this.databaseService.repository.update({
      where: { id },
      data: { status },
    });
  }

  async findAll(user: BackendJwtPayload) {
    const whereClause =
      user.role === Role.Admin || user.role === Role.IT
        ? {}
        : { ownerId: user.id };

    const repoIds = await this.databaseService.request.findMany({
      where: whereClause,
      select: {
        repositoryId: true,
      },
    });

    const repositoryIdList = repoIds.map((r) => r.repositoryId);

    const listOfRepo = await this.databaseService.repository.findMany({
      where: {
        id: {
          in: repositoryIdList,
        },
      },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        request: {
          select: {
            owner: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        RepositoryCollaborator: {
          select: {
            user: true,
          },
        },
      },
    });

    return listOfRepo;
  }

  async findByName(name: string) {
    const foundRepository = await this.databaseService.repository.findUnique({
      where: { name },
    });

    if (!foundRepository) {
      return {
        exists: false,
      };
    }
    return {
      exists: true,
    };
  }

  async createRepositoryAws(dto: CreateAwsRepositoriesDto) {}

  async createRepositoryAzure(dto: CreateAzureRepositoriesDto) {
    const { resources, ...repository } = dto;

    const existingRepository = await this.findByName(repository.name);
    if (existingRepository.exists) {
      return { message: 'Repository already exists' };
    }

    const collaborators = await this.databaseService.user.findMany({
      where: {
        email: { in: repository.collaborators },
      },
      select: { email: true },
    });

    const validEmails = collaborators.map((user) => user.email);

    if (validEmails.length !== repository.collaborators.length) {
      const missing = repository.collaborators.filter(
        (email) => !validEmails.includes(email),
      );
      return {
        message: 'Some collaborators not found',
        missing,
      };
    }

    const newResourceConfig = await this.databaseService.resourceConfig.create({
      data: {
        AzureVMInstance: {
          create: resources.resourceConfig.vms.map((vm) => ({
            name: vm.name,
            numberOfCores: vm.numberOfCores,
            memory: vm.memory,
            os: vm.os,
            sizeId: vm.sizeId,
          })),
        },
        AzureDatabase: {
          create: resources.resourceConfig.dbs.map((db) => ({
            engine: db.engine,
            storageGB: db.storageGB,
          })),
        },
        AzureStorage: {
          create: resources.resourceConfig.sts.map((st) => ({
            name: st.name,
            sku: st.sku,
            kind: st.kind,
            accessTier: st.accessTier,
          })),
        },
      },
    });

    const newResources = await this.databaseService.resources.create({
      data: {
        name: resources.name,
        cloudProvider: resources.cloudProvider as CloudProvider,
        region: resources.region,
        resourceConfig: {
          connect: {
            id: newResourceConfig.id,
          },
        },
      },
    });

    const newRepository = await this.databaseService.repository.create({
      data: {
        name: repository.name,
        description: repository.description ?? '',
        collaborators: {
          connect: repository.collaborators?.map((email) => ({ email })) || [],
        },
        resources: {
          connect: {
            id: newResources.id,
          },
        },
      },
    });

    return newRepository;
  }
}
