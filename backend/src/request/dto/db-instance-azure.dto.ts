import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString } from 'class-validator';

export class CreateAzureDatabaseInstanceDto {
  @ApiProperty({
    example: 'my-database',
    description: 'The name of the database instance',
  })
  @IsString()
  name: string;

  @ApiProperty({
    example: 'postgres',
    description: 'The database engine for the database instance',
  })
  @IsString()
  engine: string;

  @ApiProperty({
    example: '100',
    description: 'The amount of storage (in GB) for the database instance',
  })
  @IsInt()
  storageGB: number;

  @ApiProperty({
    example: 'db-sku-standard',
    description: 'The SKU name for the database instance',
  })
  @IsString()
  skuName: string;

  @ApiProperty({
    example: 'dbadmin',
    description: 'The admin username for the database instance',
  })
  @IsString()
  username: string;

  @ApiProperty({
    example: 'securePassword123!',
    description: 'The admin password for the database instance',
  })
  @IsString()
  password: string;
}
