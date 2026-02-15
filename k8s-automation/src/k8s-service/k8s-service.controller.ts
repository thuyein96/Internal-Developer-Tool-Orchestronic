import {
  Controller,
  Post,
  Body,
  BadRequestException,
  Delete,
  Get,
  Query,
} from '@nestjs/common';
import { KubernetesService } from './k8s-service.service';
import { KubeConfigObject } from './dtos/kubeconfig';
import { stringify as toYaml } from 'yaml';
const crypto = require('crypto');

@Controller('')
export class KubernetesController {
  constructor(private readonly kubernetesService: KubernetesService) {}

  @Post('initialize')
  async initializeK8s(
    @Body()
    { name, host, image, port, usePrivateRegistry, kubeConfig }: { name: string; host: string, image: string; port: number; usePrivateRegistry: boolean; kubeConfig: KubeConfigObject },
  ): Promise<any> {
    if (name === undefined || image === undefined || port === undefined || usePrivateRegistry === undefined)
      throw new BadRequestException('Invalid Request, Parameters missing');

    // Convert kubeconfig object to YAML string
    const kubeConfigString = this.kubernetesService.kubeconfigObjectToYamlPretty(kubeConfig);
    console.log('Decoded KubeConfig:', kubeConfigString);
    const deployment = await this.kubernetesService.createDeployment({
      name: name,
      image: image,
      usePrivateRegistry,
      kubeConfig: kubeConfigString,
    });
    
    if (!deployment.success) throw new BadRequestException(deployment.message);

    const service = await this.kubernetesService.createService({
      name: name,
      port: port,
      kubeConfig: kubeConfigString,
    });
    if (!service.success) throw new BadRequestException(service.message);

    const ingress = await this.kubernetesService.createIngress({
      name: name,
      host: host,
      kubeConfig: kubeConfigString,
    });
    console.log(ingress);
    if (!ingress.success) throw new BadRequestException(ingress.message);

    return {
      success: true,
      message: `Kubernetes Deployment Successfull! \n🚀 App link => http://${name}.life-au.live`,
    };
  }

  @Post('create-deployment')
  async createDeployment(
    @Body() { name, image, usePrivateRegistry, kubeConfig }: { name: string; image: string; usePrivateRegistry: boolean; kubeConfig: string },
  ) {
    try {
      const result = await this.kubernetesService.createDeployment({
        name: name,
        image: image,
        usePrivateRegistry,
        kubeConfig: kubeConfig,
      });
      return {
        success: true,
        message: result,
      };
    } catch (error) {
      return {
        success: false,
        message: error,
      };
    }
  }

  @Post('create-service')
  async createService(@Body() { name, port, kubeConfig }: { name: string; port: number; kubeConfig: string }) {
    try {
      const result = await this.kubernetesService.createService({
        name: name,
        port: port,
        kubeConfig: kubeConfig,
      });
      return {
        success: true,
        message: result,
      };
    } catch (error) {
      return {
        success: false,
        message: error,
      };
    }
  }

  @Post('create-ingress')
  async createIngress(@Body() { name, host, kubeConfig }: { name: string; host: string; kubeConfig: string }) {
    try {
      const result = await this.kubernetesService.createIngress({
        name: name,
        host: host,
        kubeConfig: kubeConfig,
      });
      return {
        success: true,
        message: result,
      };
    } catch (error) {
      return {
        success: false,
        message: error,
      };
    }
  }

  @Delete('down')
  async downK8s(@Body() { name, kubeConfig }: { name: string; kubeConfig: string }): Promise<any> {
    try {
      const result = await this.kubernetesService.deleteK8sResources({
        name: name,
        kubeConfig: kubeConfig,
      });
      return {
        success: true,
        message: result,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }

  @Get('deployments')
  async getDeployments(@Query() query: { kubeConfig: string }): Promise<any> {
    try {
      const result = await this.kubernetesService.getDeployments(query.kubeConfig);
      return {
        success: true,
        message: result,
      };
    } catch (error) {
      return {
        success: false,
        message: error,
      };
    }
  }

  @Get('services')
  async getServices(@Query() query: { kubeConfig: string }): Promise<any> {
    try {
      const result = await this.kubernetesService.getServices(query.kubeConfig);
      return {
        success: true,
        message: result,
      };
    } catch (error) {
      return {
        success: false,
        message: error,
      };
    }
  }

  @Get('ingresses')
  async getIngresses(@Query() query: { kubeConfig: string }): Promise<any> {
    try {
      const result = await this.kubernetesService.getIngresses(query.kubeConfig);
      return {
        success: true,
        message: result,
      };
    } catch (error) {
      return {
        success: false,
        message: error,
      };
    }
  }

  @Get('pods')
  async getPods(@Query() query: { kubeConfig: string }): Promise<any> {
    try {
      const result = await this.kubernetesService.getPods(query.kubeConfig);
      return {
        success: true,
        message: result,
      };
    } catch (error) {
      return {
        success: false,
        message: error,
      };
    }
  }
}


