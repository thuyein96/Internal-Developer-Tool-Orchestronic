import { ApiProperty } from "@nestjs/swagger";
import { CreateK8sClusterDto } from "./k8s-cluster.dto";
import { IsArray, IsOptional } from "class-validator";

export class CreateClusterResourceConfigDto {
  @ApiProperty({
    type: [CreateK8sClusterDto],
    description: 'List of K8s clusters to be created',
  })
  @IsOptional()
  @IsArray()
  cluster: CreateK8sClusterDto[];
}