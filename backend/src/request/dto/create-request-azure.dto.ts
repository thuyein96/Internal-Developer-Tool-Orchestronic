import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';
import { CreateRepositoryDto } from './create-repository.dto';
import { CreateAzureResourceDto } from '../../resource/dto/create-azure-resource.dto';

export class CreateAzureRequestDto {
  @IsString()
  @IsOptional()
  @ApiProperty({
    example: 'Request description',
    description: 'A description of the request',
    required: false,
  })
  description: string;

  @ApiProperty({ type: CreateRepositoryDto })
  repository: CreateRepositoryDto;

  @ApiProperty({ type: CreateAzureResourceDto })
  resources: CreateAzureResourceDto;
}
