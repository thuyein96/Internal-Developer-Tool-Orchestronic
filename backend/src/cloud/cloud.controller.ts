import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UnauthorizedException,
} from '@nestjs/common';
import { CloudService } from './cloud.service';
import { SecretDto } from './dto/secret.dto';
import { RequestWithHeaders } from '../lib/types';
import { RequestWithCookies } from '../lib/types';
import * as jwt from 'jsonwebtoken';
import { BackendJwtPayload } from '../lib/types';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CloudProvider } from '@prisma/client';

@Controller('cloud')
export class CloudController {
  constructor(private readonly cloudService: CloudService) {}

  @Get()
  @ApiOperation({
    summary: 'Get cloud data',
  })
  getCloudData(
    @Request() req: RequestWithCookies,
    @Query('cloudProvider') cloudProvider: CloudProvider,
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
      return this.cloudService.getSecretById(payload, cloudProvider);
    } catch (error) {
      console.error('Cloud Controller: Error decoding token', error);
      throw new UnauthorizedException('Invalid token');
    }
  }

  @Post('secret')
  @ApiOperation({
    summary: 'Create a new secret',
  })
  createSecret(
    @Body() secretData: SecretDto,
    @Request() req: RequestWithCookies,
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
      return this.cloudService.createSecret(payload, secretData);
    } catch (error) {
      console.error('Cloud Controller: Error decoding token', error);
      throw new UnauthorizedException('Invalid token');
    }
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a secret by ID',
  })
  updateSecret(
    @Request() req: RequestWithCookies,
    @Param('id') id: string,
    @Body() secretData: SecretDto,
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
      return this.cloudService.updateSecret(payload, id, secretData);
    } catch (error) {
      console.error('Cloud Controller: Error decoding token', error);
      throw new UnauthorizedException('Invalid token');
    }
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a secret by ID',
  })
  deleteSecret(@Request() req: RequestWithCookies, @Param('id') id: string) {
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
      return this.cloudService.deleteSecret(payload, id);
    } catch (error) {
      console.error('Cloud Controller: Error decoding token', error);
      throw new UnauthorizedException('Invalid token');
    }
  }
}
