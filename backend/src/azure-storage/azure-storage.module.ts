import { Module } from '@nestjs/common';
import { AzureStorageController } from './azure-storage.controller';
import { AzureStorageService } from './azure-storage.service';

@Module({
  controllers: [AzureStorageController],
  providers: [AzureStorageService]
})
export class AzureStorageModule {}
