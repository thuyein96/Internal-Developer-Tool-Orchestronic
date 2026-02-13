import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { RequestService } from '../request/request.service';
import { GetVmSizesDto } from '../request/dto/get-vm-sizes.dto';
import { Engine } from '@prisma/client';

@Injectable()
export class CloudProvidersService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly requestService: RequestService,
  ) {}

  findAzure(query: GetVmSizesDto) {
    return this.requestService.getVmSizesPaginated(query);
  }

  async findAws(params: {
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

      const skip = (page - 1) * limit;

      // Build Prisma filters
      const where: any = {
        raw: {
          path: ['ProcessorInfo', 'SupportedArchitectures'],
          array_contains: 'x86_64',
        },
      };

      if (search) {
        where.name = { contains: search, mode: 'insensitive' };
      }
      if (minCores !== undefined || maxCores !== undefined) {
        where.numberOfCores = {};
        if (minCores !== undefined) where.numberOfCores.gte = Number(minCores);
        if (maxCores !== undefined) where.numberOfCores.lte = Number(maxCores);
      }
      if (minMemory !== undefined || maxMemory !== undefined) {
        where.memoryInMB = {};
        if (minMemory !== undefined) where.memoryInMB.gte = Number(minMemory);
        if (maxMemory !== undefined) where.memoryInMB.lte = Number(maxMemory);
      }

      // Query with filters + pagination
      const [items, total] = await this.databaseService.$transaction([
        this.databaseService.awsInstanceType.findMany({
          where,
          skip,
          take: Number(limit),
        }),
        this.databaseService.awsInstanceType.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        data: items,
        meta: {
          total,
          page,
          limit,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      console.error('Error fetching AWS instance types:', error);
      throw new Error('Failed to fetch AWS instance types');
    }
  }

  async findAwsDB(params: {
    page?: number;
    limit?: number;
    search?: string;
    minStorageSize?: number;
    maxStorageSize?: number;
    engine?: Engine;
  }) {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        minStorageSize,
        maxStorageSize,
        engine,
      } = params;

      const skip = (page - 1) * limit;

      // Build dynamic Prisma filters
      const where: any = {};

      if (search) {
        where.DBInstanceClass = {
          contains: search,
          mode: 'insensitive', // case-insensitive search
        };
      }

      if (minStorageSize !== undefined || maxStorageSize !== undefined) {
        where.MinStorageSize = {};
        if (minStorageSize !== undefined) {
          where.MinStorageSize.gte = Number(minStorageSize);
        }
        if (maxStorageSize !== undefined) {
          where.MaxStorageSize.lte = Number(maxStorageSize);
        }
      }

      where.engine = engine;

      // Fetch paginated data + count in parallel
      const [data, total] = await Promise.all([
        this.databaseService.awsDatabaseType.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy: { DBInstanceClass: 'asc' }, // ✅ use exact field name from schema
        }),
        this.databaseService.awsDatabaseType.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        data,
        meta: {
          total,
          page,
          limit,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      console.error('Error fetching AWS db instance types:', error);
      throw new Error('Failed to fetch AWS db instance types');
    }
  }
}
