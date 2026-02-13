import { RepositoryStatus } from "./repo"
import {
  CloudProvider,
  ResourceAwsConfig,
  ResourceAzureConfig,
} from "./resource"
import { Role } from "./role"

export interface VmSizeDto {
  id: string
  name: string
  numberOfCores: number
  maxDataDiskCount: number
  memoryInMB: number
  osDiskSizeInMB: number
  resourceDiskSizeInMB: number
}

export interface VMPolicyDto {
  name: string
  numberOfCores: number
  memoryInMB: number
}

export interface DatabaseAzurePolicyDto {
  maxStorage: number
}

export interface updatePolicyVMAws {
  name: string
  numberOfCores: number
  memoryInMB: number
}

export interface StorageAzurePolicyDto {
  maxStorage: number
}

export interface PaginationMetaDto {
  total: number
  page: number
  limit: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export interface PaginatedVmSizesDto {
  data: VmSizeDto[]
  meta: PaginationMetaDto
}

export interface AzureRetailPriceItem {
  currencyCode: string
  tierMinimumUnits: number
  retailPrice: number
  unitPrice: number
  armRegionName: string
  location: string
  effectiveStartDate: string
  meterId: string
  meterName: string
  productId: string
  skuId: string
  productName: string
  skuName: string
  serviceName: string
  serviceId: string
  serviceFamily: string
  unitOfMeasure: string
  type: string
  isPrimaryMeterRegion: boolean
  armSkuName: string
}

export interface AzureRetailPriceResponse {
  BillingCurrency: string
  CustomerEntityId: string
  CustomerEntityType: string
  Items: AzureRetailPriceItem[]
  NextPageLink: string | null
  Count: number
}

export interface AwsVmSizeDto {
  id: string
  name: string
  // raw: string
  raw: unknown
  numberOfCores: number
  memoryInMB: number
}

export interface DatabaseAwsPolicyDto {
  maxStorage: number
}

export interface StorageAwsPolicyDto {
  maxStorage: number
}

export interface AzureRequestDetail {
  id: string
  displayCode: string
  status: "Pending" | "Approved" | "Rejected"
  description: string
  ownerId: string
  repositoryId: string
  resourcesId: string
  createdAt: Date
  updatedAt: Date
  feedback?: string
  resources: {
    id: string
    name: string
    cloudProvider: CloudProvider
    region: string
    size: VmSizeDto
    sizeId: string
    resourceConfigId: string
    resourceConfig: ResourceAzureConfig
  }
  repository: {
    id: string
    name: string
    description: string | null
    status: RepositoryStatus
    resourcesId: string
    RepositoryCollaborator: {
      userId: string
      repositoryId: string
      user: {
        id: string
        email: string
        name: string
        role: Role
      }
      assignedAt: string
    }[]
  }
  owner: {
    id: string
    name: string
    email: string
    role: Role
  }
}

export interface AwsRequestDetail {
  id: string
  displayCode: string
  status: "Pending" | "Approved" | "Rejected" | "Deleted"
  description: string
  ownerId: string
  repositoryId: string
  resourcesId: string
  createdAt: Date
  updatedAt: Date
  feedback?: string
  resources: {
    id: string
    name: string
    cloudProvider: CloudProvider
    region: string
    size: VmSizeDto
    sizeId: string
    resourceConfigId: string
    resourceConfig: ResourceAwsConfig
  }
  repository: {
    id: string
    name: string
    description: string | null
    status: RepositoryStatus
    resourcesId: string
    RepositoryCollaborator: {
      userId: string
      repositoryId: string
      user: {
        id: string
        email: string
        name: string
        role: Role
      }
      assignedAt: string
    }[]
  }
  owner: {
    id: string
    name: string
    email: string
    role: Role
  }
}

export interface DeploymentDto {
  clusterId: string
  provider: CloudProvider
  repositoryId: string
  port: number
  usePrivateRegistry: boolean
  vmEnv?: string
  storageEnv?: string
  dbEnv?: string
}
