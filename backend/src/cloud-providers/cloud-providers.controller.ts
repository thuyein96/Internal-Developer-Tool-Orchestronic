import { Controller, Get, Query } from '@nestjs/common';
import { CloudProvidersService } from './cloud-providers.service';
import { GetVmSizesDto } from '../request/dto/get-vm-sizes.dto';
import { GetCloudProviderAwsDbDto } from './dto/get-cloud-provider-aws-db.dto';

@Controller('cloud-providers')
export class CloudProvidersController {
  constructor(private readonly cloudProvidersService: CloudProvidersService) {}

  @Get('/azure')
  findAzure(@Query() query: GetVmSizesDto) {
    return this.cloudProvidersService.findAzure(query);
  }

  @Get('/aws')
  async findAws(@Query() query: GetVmSizesDto) {
    return this.cloudProvidersService.findAws(query);
  }

  @Get('/aws-db')
  findAwsDB(@Query() query: GetCloudProviderAwsDbDto) {
    return this.cloudProvidersService.findAwsDB(query);
  }
}
