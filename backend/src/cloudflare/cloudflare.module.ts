import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CloudflareService } from './cloudflare.service';
import { DnsController } from './cloudflare.controller';

@Module({
  imports: [HttpModule],
  controllers: [DnsController],
  providers: [CloudflareService],
  exports: [CloudflareService],
})
export class CloudflareModule {}
