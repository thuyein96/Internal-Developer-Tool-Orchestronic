import { PartialType } from '@nestjs/swagger';
import { CreateCloudProviderDto } from './create-cloud-provider.dto';

export class UpdateCloudProviderDto extends PartialType(CreateCloudProviderDto) {}
