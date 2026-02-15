import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { K8sServiceModule } from './k8s-service/k8s-service.module';
import { KubernetesController } from './k8s-service/k8s-service.controller';
import { KubernetesService } from './k8s-service/k8s-service.service';

@Module({
  imports: [K8sServiceModule],
  controllers: [AppController, KubernetesController],
  providers: [AppService, KubernetesService],
})
export class AppModule {}
