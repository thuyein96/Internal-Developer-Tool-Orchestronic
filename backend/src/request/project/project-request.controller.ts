import { GitlabService } from '../../gitlab/gitlab.service';
import { ProjectRequestService } from './project-request.service';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  Body,
  Controller,
  Get,
  HttpException,
  InternalServerErrorException,
  Param,
  Patch,
  Post,
  Request,
  UnauthorizedException,
} from '@nestjs/common';
import { BackendJwtPayload, RequestWithCookies } from '../../lib/types';
import * as jwt from 'jsonwebtoken';
import { CloudProvider, Status } from '@prisma/client';
import { CreateProjectRequestDto } from './dto/request/create-project-request.dto';
import { AddRepositoryToK8sClusterDto } from './dto/request/update-repository.dto';
import { GetClusterByIdResponseDto } from './dto/response/get-cluster-by-id-response-azure.dto';
import { GetClusterByUserIdResponseDto } from './dto/response/get-cluster-by-user-id-response.dto';
import { AzureK8sClusterDto } from './dto/response/cluster-response-azure.dto';
import { AddRepositoryToClusterResponseAzureDto } from './dto/response/add-repository-to-cluster-response-azure.dto';
import { th } from '@faker-js/faker/.';
import { CreateClusterRequestDto } from './dto/request/create-cluster-request.dto';
import { UpdateClusterRequestStatusDto } from './dto/request/update-cluster.dto';

@Controller('project')
export class ProjectRequestController {
  constructor(
    private readonly clusterRequestService: ProjectRequestService,
    private readonly gitlabService: GitlabService,
  ) {}

  // @Post()
  // @ApiOperation({
  //   summary: 'Create a new project request',
  // })
  // @ApiBody({ type: CreateProjectRequestDto })
  // async createProjectRequest(
  //   @Request() req: RequestWithCookies,
  //   @Body() request: CreateProjectRequestDto,
  // ) {
  //   const token = req.cookies?.['access_token'];
  //   if (token === undefined) {
  //     throw new UnauthorizedException('No access token');
  //   }
  //   const secret = process.env.JWT_SECRET;
  //   if (!secret) {
  //     throw new Error('JWT_SECRET not defined');
  //   }

  //   try {
  //     const decoded = jwt.verify(token, secret) as unknown;
  //     const payload = decoded as BackendJwtPayload;
  //     const response = await this.clusterRequestService.createProjectRequest(payload, request);

  //     if(!response) return new Error('Failed to create project request');
  //     const project: CreateProjectResponseDto = {
  //       statuscode: 201,
  //       message: response,
  //     };
  //     return project;

  //   } catch {
  //     console.error('Request Controller: Error decoding token');
  //     throw new Error('Invalid token - unable to process');
  //   }
  // }

  @Post('/azure')
  @ApiOperation({
    summary: 'Create a new Azure cluster',
  })
  @ApiBody({ type: CreateClusterRequestDto })
  async createAzureClusterRequest(
    @Request() req: RequestWithCookies,
    @Body() request: CreateClusterRequestDto,
  ) {
    const token = req.cookies?.['access_token'];
    if (token === undefined) {
      throw new UnauthorizedException('No access token');
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET not defined');
    }

    try {
      const decoded = jwt.verify(token, secret) as unknown;
      const payload = decoded as BackendJwtPayload;
      const response = await this.clusterRequestService.createCluster(
        payload,
        request,
      );
      if (!response) {
        throw new Error('Failed to create Azure cluster');
      }

      return response;
    } catch (error) {
      console.error('Request Controller: Error decoding token');
      throw new Error('Invalid token - unable to process');
    }
  }

  @Post('/aws')
  @ApiOperation({
    summary: 'Create a new AWS cluster',
  })
  @ApiBody({ type: CreateClusterRequestDto })
  async createAWSClusterRequest(
    @Request() req: RequestWithCookies,
    @Body() request: CreateClusterRequestDto,
  ) {
    const token = req.cookies?.['access_token'];
    if (token === undefined) {
      throw new UnauthorizedException('No access token');
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET not defined');
    }

    try {
      const decoded = jwt.verify(token, secret) as unknown;
      const payload = decoded as BackendJwtPayload;
      const response = await this.clusterRequestService.createCluster(
        payload,
        request,
      );
      if (!response) {
        throw new Error('Failed to create AWS cluster');
      }

      return response;
    } catch (error) {
      console.error('Request Controller: Error decoding token');
      throw new Error('Invalid token - unable to process');
    }
  }

  // @Patch('/azure')
  // @ApiOperation({
  //   summary: 'Update an existing Azure cluster',
  // })
  // @ApiBody({ type: UpdateAzureClusterDto })
  // async updateAzureClusterRequest(
  //   @Request() req: RequestWithCookies,
  //   @Body() updateClusterDto: UpdateAzureClusterDto,
  // ) {
  //   const token = req.cookies?.['access_token'];
  //   if (token === undefined) {
  //     throw new UnauthorizedException('No access token');
  //   }

  //   const secret = process.env.JWT_SECRET;
  //   if (!secret) {
  //     throw new Error('JWT_SECRET not defined');
  //   }

  //   try {
  //     const decoded = jwt.verify(token, secret) as unknown;
  //     const payload = decoded as BackendJwtPayload;
  //     const response =
  //       await this.clusterRequestService.updateClusterRequestStatus(
  //         payload,
  //         updateClusterDto,
  //       );
  //     if (!response) {
  //       throw new Error('Failed to update Azure cluster');
  //     }

  //     return response;
  //   } catch (error) {
  //     console.error('Request Controller: Error decoding token');
  //     throw new Error('Invalid token - unable to process');
  //   }
  // }

  // project-request.controller.ts - updateAzureClusterRequest method
  @Patch()
  @ApiOperation({
    summary: 'Update an existing K8s cluster',
  })
  @ApiBody({ type: UpdateClusterRequestStatusDto })
  async updateAzureClusterRequest(
    @Request() req: RequestWithCookies,
    @Body() updateClusterDto: UpdateClusterRequestStatusDto,
  ) {
    const token = req.cookies?.['access_token'];

    console.log('=== Update Cluster Request Debug ===');
    console.log('Token exists:', !!token);
    console.log('Request body:', updateClusterDto);

    if (token === undefined) {
      console.error('No access token found in cookies');
      throw new UnauthorizedException('No access token');
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('JWT_SECRET not defined in environment');
      throw new Error('JWT_SECRET not defined');
    }

    try {
      const decoded = jwt.verify(token, secret) as unknown;
      const payload = decoded as BackendJwtPayload;

      console.log('Token decoded successfully, user:', payload.id);
      console.log(
        'Updating cluster request:',
        updateClusterDto.clusterRequestId,
      );

      const response =
        await this.clusterRequestService.updateClusterRequestStatus(
          payload,
          updateClusterDto,
        );

      if (!response) {
        throw new Error('Failed to update K8s cluster');
      }

      console.log('Cluster updated successfully');
      return response;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        console.error('Token has expired:', error.message);
        throw new UnauthorizedException(
          'Token has expired. Please log in again.',
        );
      } else if (error.name === 'JsonWebTokenError') {
        console.error('Invalid token:', error.message);
        throw new UnauthorizedException('Invalid token. Please log in again.');
      } else {
        console.error('Request Controller: Error processing request:', error);
        throw new Error(`Unable to process request: ${error.message}`);
      }
    }
  }

  @Get('cluster/:clusterRequestId')
  async getAzureClusterRequestById(
    @Param('clusterRequestId') clusterRequestId: string,
  ) {
    return this.clusterRequestService.findClusterRequestsByReqId(
      clusterRequestId,
    );
  }

  @Get('clusters')
  @ApiOperation({
    summary: 'Get all Azure clusters',
  })
  async getAllAzureClusters() {
    const response = await this.clusterRequestService.findAllClusterRequests();
    if (!response) {
      throw new Error('No Azure clusters found');
    }

    return response;
  }

  @Get('me/cluster')
  async getAzureClustersByUserId(@Request() req: RequestWithCookies) {
    const token = req.cookies?.['access_token'];
    if (token === undefined) {
      throw new UnauthorizedException('No access token');
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET not defined');
    }

    try {
      const decoded = jwt.verify(token, secret) as unknown;
      const payload = decoded as BackendJwtPayload;
      const response =
        await this.clusterRequestService.findClustersByUserId(payload);
      if (!response) {
        throw new Error('No Azure clusters found for user');
      }

      return response;
    } catch (error) {
      console.error('Get Cluster by user id error:', error);

      if (error instanceof HttpException) {
        throw error; // preserve status code + message
      }

      throw new InternalServerErrorException(
        error?.message ?? 'Failed to get clusters for user',
      );
    }
  }

  @Get('me/approved-clusters')
  @ApiOperation({
    summary: 'Get all approved clusters for the logged-in user',
  })
  async getApprovedClustersForUser(@Request() req: RequestWithCookies) {
    const token = req.cookies?.['access_token'];
    if (token === undefined) {
      throw new UnauthorizedException('No access token');
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET not defined');
    }

    try {
      const decoded = jwt.verify(token, secret) as unknown;
      const payload = decoded as BackendJwtPayload;
      const response =
        await this.clusterRequestService.findAllApprovedClustersByUserId(
          payload,
        );
      if (!response) {
        throw new Error('No approved clusters found for user');
      }

      return response;
    } catch (error) {
      console.error('Get approved clusters for user error:', error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException(
        error?.message ?? 'Failed to get approved clusters for user',
      );
    }
  }

  @Get('me/cluster/:status')
  @ApiOperation({
    summary: 'Get clusters by user ID and status',
  })
  async getAzureClustersByUserIdAndStatus(
    @Request() req: RequestWithCookies,
    @Param('status') status: Status,
  ) {
    const token = req.cookies?.['access_token'];
    if (token === undefined) {
      throw new UnauthorizedException('No access token');
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET not defined');
    }

    try {
      const decoded = jwt.verify(token, secret) as unknown;
      const payload = decoded as BackendJwtPayload;
      const response =
        await this.clusterRequestService.findClustersByUserIdAndStatus(
          payload,
          status,
        );
      if (!response) {
        throw new Error('No Azure clusters found for user');
      }

      return response;
    } catch (error) {
      console.error('Get Cluster by user id error:', error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException(
        error?.message ?? 'Failed to get clusters for user',
      );
    }
  }

  @Patch('deploy')
  @ApiOperation({
    summary: 'Deploy image to K8s cluster',
  })
  @ApiBody({ type: AddRepositoryToK8sClusterDto })
  async deployToK8sCluster(
    @Request() req: RequestWithCookies,
    @Body() request: AddRepositoryToK8sClusterDto,
  ) {
    const token = req.cookies?.['access_token'];
    if (token === undefined) {
      throw new UnauthorizedException('No access token');
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET not defined');
    }

    try {
      console.log(
        '[Controller] Starting DeployToK8sCluster with request:',
        request,
      );
      const response =
        await this.clusterRequestService.DeployToK8sCluster(request);

      if (!response) {
        throw new Error('No response from deploying to K8s cluster');
      }

      const result: AddRepositoryToClusterResponseAzureDto = {
        statuscode: 200,
        message: `Deployed to K8s cluster successfully => ${response}`,
      };
      return result;
    } catch (error) {
      console.error('=== Controller DeployToK8sCluster Error ===');
      console.error('Error type:', error.constructor.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      console.error('Full error:', error);
      console.error('==========================================');

      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException(
        error?.message ?? 'Failed to deploy to K8s cluster',
      );
    }
  }

  @Get('/pending-clusters')
  @ApiOperation({
    summary: 'Get all pending cluster requests',
  })
  async getAllPendingClusters() {
    const response = await this.clusterRequestService.findAllPendingClusters();
    if (!response) {
      throw new Error('No pending clusters found');
    }

    return response;
  }

  @Get('/approved-clusters')
  @ApiOperation({
    summary: 'Get all approved cluster requests',
  })
  async getAllApprovedClusters() {
    const response = await this.clusterRequestService.findAllApprovedClusters();
    if (!response) {
      throw new Error('No approved clusters found');
    }

    return response;
  }

  @Get('/resources/:clusterRequestId')
  @ApiOperation({
    summary: 'Get resources by cluster ID',
  })
  async getClusterResourcesById(
    @Param('clusterRequestId') clusterRequestId: string,
  ) {
    const response =
      await this.clusterRequestService.findClusterResourcesById(
        clusterRequestId,
      );
    if (!response) {
      throw new Error('No resources found for cluster');
    }

    return response;
  }

  @Get('/resource-config/:clusterRequestId')
  @ApiOperation({
    summary: 'Get resource config by cluster ID',
  })
  async getClusterResourceConfigById(
    @Param('clusterRequestId') clusterRequestId: string,
  ) {
    const response =
      await this.clusterRequestService.findClusterResourceConfigById(
        clusterRequestId,
      );
    if (!response) {
      throw new Error('No resource config found for cluster');
    }

    return response;
  }

  @Get('/clusters/:status')
  @ApiOperation({
    summary: 'Get clusters by status',
  })
  async getClustersByStatus(@Param('status') status: Status) {
    const response =
      await this.clusterRequestService.findAllClustersWithStatus(status);
    if (!response) {
      throw new Error('No clusters found for the specified status');
    }

    return response;
  }

  @Get('/deployments/:repositoryId')
  async getImageDeploymentsByRepoId(
    @Param('repositoryId') repositoryId: string,
  ) {
    const response =
      await this.clusterRequestService.findImageDeploymentsByRepoId(
        repositoryId,
      );
    if (!response) {
      throw new Error(
        'No image deployments found for the specified repository',
      );
    }
    return response;
  }
}
