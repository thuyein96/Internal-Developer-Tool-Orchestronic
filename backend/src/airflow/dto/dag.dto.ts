import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class DagDto {
  // @IsNotEmpty()
  // @IsString()
  // @ApiProperty({
  //   example: '3447gle2rm46l83mdl3',
  //   description: 'Project ID for the DAG',
  // })
  // projectId: string;
}
