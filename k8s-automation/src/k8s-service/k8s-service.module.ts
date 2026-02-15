
import { Module } from '@nestjs/common';
import { KubernetesService } from './k8s-service.service';
import { KubernetesController } from './k8s-service.controller';

@Module({
    imports: [],
    controllers: [KubernetesController],
    providers: [KubernetesService],
    exports: [KubernetesService],
})
export class K8sServiceModule {}