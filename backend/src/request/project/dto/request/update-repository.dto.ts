import { ApiProperty } from '@nestjs/swagger';
import { CloudProvider } from '@prisma/client';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class AddRepositoryToK8sClusterDto {
  @IsString()
  @ApiProperty({
    example: 'uuid-of-cluster',
  })
  clusterId: string;

  @IsString()
  @ApiProperty({
    example: 'azure',
  })
  provider: CloudProvider;

  @IsString()
  @ApiProperty({
    example: 'uuid-of-repository',
  })
  repositoryId: string;

  @IsNumber()
  @ApiProperty({
    example: 80,
  })
  port: number;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({
    description: 'Indicates whether the image is hosted on a private registry',
    example: false,
    required: false,
  })
  usePrivateRegistry?: boolean;
}
