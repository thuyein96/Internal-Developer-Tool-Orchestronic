import { ApiProperty } from '@nestjs/swagger';
import { Engine } from '@prisma/client';

export class CreateAwsDatabaseInstanceDto {
  @ApiProperty({ example: 'admin', description: 'Database username' })
  dbUsername: string;

  @ApiProperty({ example: 'P@ssw0rd!', description: 'Database password' })
  dbPassword: string;

  @ApiProperty({ example: '12312312', description: 'AWS DB instance class ID' })
  awsDatabaseTypeId: string;

  @ApiProperty({ example: 20, description: 'Allocated storage in GB' })
  dbAllocatedStorage: number;

  @ApiProperty({
    enum: Engine,
    example: Engine.PostgreSQL,
    description: 'Database engine',
  })
  engine: Engine;

  @ApiProperty({ example: 'mydb', description: 'Database name' })
  dbName: string;

  @ApiProperty({
    example: 'resource-config-id',
    description: 'ResourceConfig relation ID',
  })
  resourceConfigId: string;
}
