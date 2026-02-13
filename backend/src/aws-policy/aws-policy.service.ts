import { Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { DatabaseService } from '../database/database.service';
import { BackendJwtPayload } from '../lib/types';
import { AwsVMPolicyDto } from './dto/aws-vm-policy.dto';
import { AwsDBPolicyDto } from './dto/aws-db-policy.dto';
import { AwsSTPolicyDto } from './dto/aws-st-policy.dto';

@Injectable()
export class AwsPolicyService {
  constructor(private readonly databaseService: DatabaseService) {}

  getPolicyVM() {
    try {
      return this.databaseService.awsPolicyVM.findFirst({});
    } catch (error) {
      console.error('Error fetching VM policies:', error);
      throw new Error('Failed to fetch VM policies');
    }
  }

  getPolicyDB() {
    try {
      return this.databaseService.awsPolicyDatabase.findFirst({});
    } catch (error) {
      console.error('Error fetching DB policies:', error);
      throw new Error('Failed to fetch DB policies');
    }
  }

  getPolicyST() {
    try {
      return this.databaseService.awsPolicyStorage.findFirst({});
    } catch (error) {
      console.error('Error fetching ST policies:', error);
      throw new Error('Failed to fetch ST policies');
    }
  }

  updatePolicyVM(user: BackendJwtPayload, policyData: AwsVMPolicyDto) {
    if (user.role !== Role.Admin) {
      throw new Error('Unauthorized: Only admins can update VM policies');
    }
    return this.databaseService.awsPolicyVM.updateMany({
      data: {
        ...policyData,
      },
    });
  }

  updatePolicyDB(user: BackendJwtPayload, policyData: AwsDBPolicyDto) {
    if (user.role !== Role.Admin) {
      throw new Error('Unauthorized: Only admins can update DB policies');
    }
    return this.databaseService.awsPolicyDatabase.updateMany({
      data: {
        ...policyData,
      },
    });
  }

  updatePolicyST(user: BackendJwtPayload, policyData: AwsSTPolicyDto) {
    if (user.role !== Role.Admin) {
      throw new Error('Unauthorized: Only admins can update ST policies');
    }
    return this.databaseService.awsPolicyStorage.updateMany({
      data: {
        ...policyData,
      },
    });
  }

  getPolicyClusterAWS() {
    try {
      return this.databaseService.awsPolicyVM.findFirst({
        where: {
          name: '',
        },
      });
    } catch (error) {
      throw new Error('Failed to fetch VM policy');
    }
  }
}
