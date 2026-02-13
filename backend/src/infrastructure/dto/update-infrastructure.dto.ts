import { PartialType } from '@nestjs/swagger';
import { CreateInfrastructureDto } from './create-infrastructure.dto';

export class UpdateInfrastructureDto extends PartialType(CreateInfrastructureDto) {}
