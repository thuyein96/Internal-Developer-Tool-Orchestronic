import { ApiProperty } from "@nestjs/swagger";
import { CreateAWSK8sClusterDto } from "./k8s-cluster-aws.dto";
import { IsArray, IsOptional } from "class-validator";
import { CreateK8sClusterDto } from "../k8s-cluster.dto";

export class CreateClusterResourceAWSConfigDto {
  @ApiProperty({
    type: [CreateK8sClusterDto],
    description: 'List of K8s clusters to be created',
  })
  @IsOptional()
  @IsArray()
  cluster: CreateK8sClusterDto[];
}