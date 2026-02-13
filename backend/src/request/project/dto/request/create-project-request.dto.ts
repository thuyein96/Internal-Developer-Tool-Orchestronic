import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';
import { CreateRepositoryDto } from '../../../../request/dto/create-repository.dto';

export class CreateProjectRequestDto {
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
}
