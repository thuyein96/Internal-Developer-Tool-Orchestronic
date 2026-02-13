import { Injectable } from '@nestjs/common';
import { CreateAzureResourceDto } from './dto/create-azure-resource.dto';
import { DatabaseService } from '../database/database.service';
import { BackendJwtPayload } from '../lib/types';
import { Role } from '@prisma/client';

export interface AzureRetailPriceItem {
  currencyCode: string;
  tierMinimumUnits: number;
  retailPrice: number;
  unitPrice: number;
  armRegionName: string;
  location: string;
  effectiveStartDate: string;
  meterId: string;
  meterName: string;
  productId: string;
  skuId: string;
  productName: string;
  skuName: string;
  serviceName: string;
  serviceId: string;
  serviceFamily: string;
  unitOfMeasure: string;
  type: string;
  isPrimaryMeterRegion: boolean;
  armSkuName: string;
}

export interface AzureRetailPriceResponse {
  BillingCurrency: string;
  CustomerEntityId: string;
  CustomerEntityType: string;
  Items: AzureRetailPriceItem[];
  NextPageLink: string | null;
  Count: number;
}

@Injectable()
export class ResourceService {
  constructor(private readonly databaseService: DatabaseService) {}

  async getVmPrice(vmSize: string, region: string) {
    const url = `https://prices.azure.com/api/retail/prices?$filter=armSkuName eq '${vmSize}' and armRegionName eq '${region}' and priceType eq 'Consumption' and serviceName eq 'Virtual Machines'`;

    try {
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Azure API responded with ${res.status}`);
      }
      const data = (await res.json()) as AzureRetailPriceResponse;
      return data;
    } catch (err) {
      throw new Error(`Failed to fetch Azure VM price: ${err.message}`);
    }
  }

  findAll(user: BackendJwtPayload) {
    const whereClause =
      user.role === Role.Admin || user.role === Role.IT
        ? {}
        : { request: { ownerId: user.id } };

    return this.databaseService.resources.findMany({
      where: whereClause,
      include: {
        request: {
          select: {
            id: true,
            displayCode: true,
          },
        },
        resourceConfig: {
          include: {
            AzureVMInstance: {
              select: {
                id: true,
              },
            },
            AzureDatabase: {
              select: {
                id: true,
              },
            },
            AwsStorage: {
              select: {
                id: true,
              },
            },
          },
        },
        repository: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  findResourceGroups(user: BackendJwtPayload) {
    return this.databaseService.request.findMany({
      where: { ownerId: user.id },
      select: {
        resources: true,
      },
      distinct: ['id'],
    });
  }
}
