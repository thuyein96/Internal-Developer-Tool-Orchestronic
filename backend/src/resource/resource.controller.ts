import { Controller, Get, Post, Body, Request, Query } from '@nestjs/common';
import { ResourceService } from './resource.service';
import { ApiOperation } from '@nestjs/swagger';
import { BackendJwtPayload, RequestWithHeaders } from '../lib/types';
import { RequestWithCookies } from '../lib/types';
import { UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

@Controller('resource')
export class ResourceController {
  constructor(private readonly resourceService: ResourceService) {}

  @Get()
  @ApiOperation({
    summary: 'Find all resources for the authenticated user',
  })
  findAll(@Request() req: RequestWithCookies) {
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
      return this.resourceService.findAll(payload);
    } catch (err) {
      console.error('Resource Controller: Error decoding token', err);
      throw new UnauthorizedException('Invalid token');
    }
  }

  @Get('vm-price')
  getVmPrice(@Query('vmSize') vmSize: string, @Query('region') region: string) {
    return this.resourceService.getVmPrice(vmSize, region);
  }

  @Get('resource-groups')
  @ApiOperation({
    summary: 'Find resource groups for the authenticated user',
  })
  findResourceGroups(@Request() req: RequestWithCookies) {
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
      return this.resourceService.findResourceGroups(payload);
    } catch (err) {
      console.error('Resource Controller: Error decoding token', err);
      throw new UnauthorizedException('Invalid token');
    }
  }
}
