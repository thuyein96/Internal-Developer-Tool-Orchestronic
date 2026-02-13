import { Controller, Param } from '@nestjs/common';
import { Get, Query, Post, Body, Request } from '@nestjs/common';
import { RepositoriesService } from './repositories.service';
import { CreateAzureRepositoriesDto } from './dto/create-azure-repository.dto';
import { CreateAwsRepositoriesDto } from './dto/create-aws-repository.dto';
import { ApiOperation } from '@nestjs/swagger';
import { BackendJwtPayload, RequestWithHeaders } from '../lib/types';
import * as jwt from 'jsonwebtoken';
import { RequestWithCookies } from '../lib/types';
import { UnauthorizedException } from '@nestjs/common';
import { RepositoryStatus } from '@prisma/client';

@Controller('repositories')
export class RepositoriesController {
  constructor(private readonly repositoriesService: RepositoriesService) {}

  @Get('available-repository')
  @ApiOperation({
    summary: 'Find available repositories by name',
  })
  findByName(@Query('name') name: string) {
    return this.repositoriesService.findByName(name);
  }

  @Post('/create-azure-repository/')
  @ApiOperation({
    summary: 'Create a new Azure repository',
  })
  createAzureRepository(@Body() repository: CreateAzureRepositoriesDto) {
    return this.repositoriesService.createRepositoryAzure(repository);
  }

  @Post('/create-aws-repository/')
  @ApiOperation({
    summary: 'Create a new AWS repository',
  })
  createAwsRepository(@Body() repository: CreateAwsRepositoriesDto) {
    return this.repositoriesService.createRepositoryAws(repository);
  }

  @Get()
  @ApiOperation({
    summary: 'Find all repositories for the authenticated user',
  })
  findAll(@Request() req: RequestWithHeaders) {
    const token = (req as RequestWithCookies).cookies?.['access_token'];
    if (token === undefined) {
      throw new UnauthorizedException('No access token');
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET not defined');
    }

    try {
      // decode as unknown first, then assert
      const decoded = jwt.verify(token, secret) as unknown;
      const payload = decoded as BackendJwtPayload;
      return this.repositoriesService.findAll(payload);
    } catch (err) {
      console.error('Repositories Controller: Error decoding token', err);
      throw new UnauthorizedException('Invalid token');
    }
  }

  updateRepositoryStatus(
    @Param('id') id: string,
    @Body() status: RepositoryStatus,
  ) {
    return this.repositoriesService.updateRepository(id, status);
  }
}
