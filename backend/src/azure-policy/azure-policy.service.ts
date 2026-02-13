import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { BackendJwtPayload } from '../lib/types';
import { AzureVMPolicyDto } from './dto/azure-vm-policy.dto';
import { Role } from '@prisma/client';
import { AzureDBPolicyDto } from './dto/azure-db-policy.dto';
import { AzureSTPolicyDto } from './dto/azure-st-policy.dto';

@Injectable()
export class AzurePolicyService {
  constructor(private readonly databaseService: DatabaseService) {}

  createPolicyVM(user: BackendJwtPayload, policyData: AzureVMPolicyDto) {
    if (user.role !== Role.Admin) {
      throw new Error('Unauthorized: Only admins can create VM policies');
    }

    return this.databaseService.azurePolicyVM.create({
      data: { ...policyData },
    });
  }

  createPolicyDB(user: BackendJwtPayload, policyData: AzureDBPolicyDto) {
    if (user.role !== Role.Admin) {
      throw new Error('Unauthorized: Only admins can create DB policies');
    }

    return this.databaseService.azurePolicyDatabase.create({
      data: { ...policyData },
    });
  }

  createPolicyST(user: BackendJwtPayload, policyData: AzureSTPolicyDto) {
    if (user.role !== Role.Admin) {
      throw new Error('Unauthorized: Only admins can create ST policies');
    }

    return this.databaseService.azurePolicyStorage.create({
      data: { ...policyData },
    });
  }

  updatePolicyVM(user: BackendJwtPayload, policyData: AzureVMPolicyDto) {
    if (user.role !== Role.Admin) {
      throw new Error('Unauthorized: Only admins can update VM policies');
    }
    return this.databaseService.azurePolicyVM.updateMany({
      data: {
        ...policyData,
      },
    });
  }

  updatePolicyDB(user: BackendJwtPayload, policyData: AzureDBPolicyDto) {
    if (user.role !== Role.Admin) {
      throw new Error('Unauthorized: Only admins can update DB policies');
    }
    return this.databaseService.azurePolicyDatabase.updateMany({
      data: {
        ...policyData,
      },
    });
  }

  updatePolicyST(user: BackendJwtPayload, policyData: AzureSTPolicyDto) {
    if (user.role !== Role.Admin) {
      throw new Error('Unauthorized: Only admins can update ST policies');
    }
    return this.databaseService.azurePolicyStorage.updateMany({
      data: {
        ...policyData,
      },
    });
  }

  getPolicyVMAzure() {
    try {
      return this.databaseService.azurePolicyVM.findFirst({});
    } catch (error) {
      console.error('Error fetching VM policies:', error);
      throw new Error('Failed to fetch VM policies');
    }
  }

  getPolicyDBAzure() {
    try {
      return this.databaseService.azurePolicyDatabase.findFirst({});
    } catch (error) {
      console.error('Error fetching DB policies:', error);
      throw new Error('Failed to fetch DB policies');
    }
  }

  getPolicySTAzure() {
    try {
      return this.databaseService.azurePolicyStorage.findFirst({});
    } catch (error) {
      console.error('Error fetching ST policies:', error);
      throw new Error('Failed to fetch ST policies');
    }
  }

  getPolicyClusterAzure() {
    try {
      return this.databaseService.azurePolicyVM.findFirst({
        where: {
          name: 'Standard_D2s_v3',
        },
      });
    } catch (error) {
      console.error('Error fetching VM policy:', error);
      throw new Error('Failed to fetch VM policy');
    }
  }
}
