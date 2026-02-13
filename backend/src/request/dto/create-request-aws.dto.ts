import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';
import { CreateRepositoryDto } from './create-repository.dto';
import { CreateAwsResourceDto } from '../../resource/dto/create-aws-resource.dto';

export class CreateAwsRequestDto {
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

  @ApiProperty({ type: CreateAwsResourceDto })
  resources: CreateAwsResourceDto;
}
