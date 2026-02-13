import { Injectable, UnauthorizedException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { BackendJwtPayload } from '../lib/types';
import { SecretDto } from './dto/secret.dto';
import { CloudProvider } from '@prisma/client';

@Injectable()
export class CloudService {
  constructor(private readonly databaseService: DatabaseService) {}

  async getSecretById(user: BackendJwtPayload, cloudProvider: CloudProvider) {
    const result = await this.databaseService.cloudResourceSecret.findFirst({
      where: { userId: user.id, cloudProvider },
    });

    return result ?? [];
  }

  createSecret(user: BackendJwtPayload, secretData: SecretDto) {
    return this.databaseService.cloudResourceSecret.create({
      data: {
        ...secretData,
        cloudProvider: secretData.cloudProvider === 'AZURE' ? 'AZURE' : 'AWS',
        userId: user.id,
      },
    });
  }

  updateSecret(
    user: BackendJwtPayload,
    secretId: string,
    secretData: SecretDto,
  ) {
    if (user.role !== 'Admin' && user.role !== 'IT') {
      throw new UnauthorizedException(
        'User does not have permission to update secrets',
      );
    }
    return this.databaseService.cloudResourceSecret.update({
      where: {
        id: secretId,
        userId: user.id,
      },
      data: {
        ...secretData,
        cloudProvider: secretData.cloudProvider === 'AZURE' ? 'AZURE' : 'AWS',
      },
    });
  }

  deleteSecret(user: BackendJwtPayload, secretId: string) {
    if (user.role !== 'Admin' && user.role !== 'IT') {
      throw new UnauthorizedException(
        'User does not have permission to delete secrets',
      );
    }

    return this.databaseService.cloudResourceSecret.delete({
      where: {
        id: secretId,
        userId: user.id,
      },
    });
  }
}
