import { ApiProperty } from '@nestjs/swagger';
import { CloudProvider } from '@prisma/client';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SecretDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'The name of the secret',
    example: 'my-secret',
  })
  clientId: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'The client secret for the cloud resource',
    example: 'my-client-secret',
  })
  clientSecret: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'The subscription ID for the cloud resource',
    example: '12345678-1234-1234-1234-123456789012',
  })
  subscriptionId: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'The tenant ID for the cloud resource',
    example: '87654321-4321-4321-4321-210987654321',
  })
  tenantId?: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'The cloud provider for the secret',
    example: 'AZURE',
  })
  cloudProvider: CloudProvider;
}
