import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString } from 'class-validator';

export class CreateAzureStorageInstanceDto {
  @IsString()
  @ApiProperty({
    example: 'MyStorage',
    description: 'The name of the storage instance',
  })
  name: string;

  @IsString()
  @ApiProperty({
    example: 'Standard_LRS',
    description: 'The type of the storage instance',
  })
  sku: string;

  @IsInt()
  @ApiProperty({
    example: 'StorageV2',
    description: 'The kind of the storage instance',
  })
  kind: number;

  @IsString()
  @ApiProperty({
    example: 'Hot',
    description: 'The access tier of the storage instance',
  })
  accessTier: string;
}
