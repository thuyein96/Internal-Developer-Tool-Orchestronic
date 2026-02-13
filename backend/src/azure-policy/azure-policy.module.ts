import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AzurePolicyController } from './azure-policy.controller';
import { AzurePolicyService } from './azure-policy.service';

@Module({
  imports: [DatabaseModule],
  controllers: [AzurePolicyController],
  providers: [AzurePolicyService],
})
export class AzurePolicyModule {}
