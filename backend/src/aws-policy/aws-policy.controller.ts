import {
  Body,
  Controller,
  Get,
  Patch,
  Request,
  UnauthorizedException,
} from '@nestjs/common';
import { AwsPolicyService } from './aws-policy.service';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BackendJwtPayload, RequestWithCookies } from '../lib/types';
import * as jwt from 'jsonwebtoken';
import { AwsVMPolicyDto } from './dto/aws-vm-policy.dto';
import { AwsDBPolicyDto } from './dto/aws-db-policy.dto';
import { AwsSTPolicyDto } from './dto/aws-st-policy.dto';

@Controller('aws/policy')
export class AwsPolicyController {
  constructor(private readonly awsPolicyService: AwsPolicyService) {}
  @Get('virtual_machine')
  @ApiOperation({
    summary: 'Get all Virtual Machine Policies',
    description: 'Retrieves all policies for virtual machines.',
  })
  @ApiResponse({
    status: 200,
    description: 'VM policies retrieved successfully',
  })
  getPolicyVM(@Request() req: RequestWithCookies) {
    const token = req.cookies?.['access_token'];
    if (token === undefined) {
      throw new UnauthorizedException('No access token');
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET not defined');
    }

    try {
      return this.awsPolicyService.getPolicyVM();
    } catch (error) {
      console.error('Error decoding token:', error);
      throw new UnauthorizedException('Invalid token');
    }
  }

  @Get('database')
  @ApiOperation({
    summary: 'Get all Database Policies',
    description: 'Retrieves all policies for databases.',
  })
  @ApiResponse({
    status: 200,
    description: 'Database policies retrieved successfully',
  })
  getPolicyDBAzure(@Request() req: RequestWithCookies) {
    const token = req.cookies?.['access_token'];
    if (token === undefined) {
      throw new UnauthorizedException('No access token');
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET not defined');
    }

    try {
      return this.awsPolicyService.getPolicyDB();
    } catch (error) {
      console.error('Error decoding token:', error);
      throw new UnauthorizedException('Invalid token');
    }
  }

  @Get('storage')
  @ApiOperation({
    summary: 'Get all Storage Policies',
    description: 'Retrieves all policies for storage resources.',
  })
  @ApiResponse({
    status: 200,
    description: 'Storage policies retrieved successfully',
  })
  getPolicySTAzure(@Request() req: RequestWithCookies) {
    const token = req.cookies?.['access_token'];
    if (token === undefined) {
      throw new UnauthorizedException('No access token');
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET not defined');
    }

    try {
      return this.awsPolicyService.getPolicyST();
    } catch (error) {
      console.error('Error decoding token:', error);
      throw new UnauthorizedException('Invalid token');
    }
  }

  @Patch('virtual_machine')
  @ApiOperation({
    summary: 'Update an existing Virtual Machine Policy',
    description: 'Updates an existing policy for managing virtual machines.',
  })
  updatePolicy(
    @Request() req: RequestWithCookies,
    @Body() policyData: AwsVMPolicyDto,
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
      return this.awsPolicyService.updatePolicyVM(payload, policyData);
    } catch (error) {
      console.error('Error decoding token:', error);
      throw new UnauthorizedException('Invalid token');
    }
  }

  @Patch('database')
  @ApiOperation({
    summary: 'Update an existing Database Policy',
    description: 'Updates an existing policy for managing databases.',
  })
  updatePolicyDB(
    @Request() req: RequestWithCookies,
    @Body() policyData: AwsDBPolicyDto,
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
      return this.awsPolicyService.updatePolicyDB(payload, policyData);
    } catch (error) {
      console.error('Error decoding token:', error);
      throw new UnauthorizedException('Invalid token');
    }
  }

  @Patch('storage')
  @ApiOperation({
    summary: 'Update an existing Storage Policy',
    description: 'Updates an existing policy for managing storage resources.',
  })
  updatePolicyST(
    @Request() req: RequestWithCookies,
    @Body() policyData: AwsSTPolicyDto,
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
      return this.awsPolicyService.updatePolicyST(payload, policyData);
    } catch (error) {
      console.error('Error decoding token:', error);
      throw new UnauthorizedException('Invalid token');
    }
  }
}
