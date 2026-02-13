import { ApiProperty } from '@nestjs/swagger';

export class VmSizeDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  numberOfCores: number;

  @ApiProperty()
  maxDataDiskCount: number;

  @ApiProperty()
  memoryInMB: number;

  @ApiProperty()
  osDiskSizeInMB: number;

  @ApiProperty()
  resourceDiskSizeInMB: number;
}

export class PaginationMetaDto {
  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;

  @ApiProperty()
  hasNext: boolean;

  @ApiProperty()
  hasPrev: boolean;
}

export class PaginatedVmSizesDto {
  @ApiProperty({ type: [VmSizeDto] })
  data: VmSizeDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}
