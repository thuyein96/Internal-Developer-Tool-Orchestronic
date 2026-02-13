import { Controller, Post, Get, Request, Body, Patch } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BackendJwtPayload } from '../lib/types';
import { RequestWithCookies } from '../lib/types';
import { UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { AzureVMPolicyDto } from './dto/azure-vm-policy.dto';
import { AzureDBPolicyDto } from './dto/azure-db-policy.dto';
import { AzureSTPolicyDto } from './dto/azure-st-policy.dto';
import { AzurePolicyService } from './azure-policy.service';

@Controller('azure/policy')
export class AzurePolicyController {
  constructor(private readonly policyService: AzurePolicyService) {}

  @Post('virtual_machine')
  @ApiOperation({
    summary: 'Create a new Virtual Machine Policy',
    description: 'Creates a new policy for managing virtual machines.',
  })
  createPolicy(
    @Request() req: RequestWithCookies,
    @Body() policyData: AzureVMPolicyDto,
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
      return this.policyService.createPolicyVM(payload, policyData);
    } catch (error) {
      console.error('Error decoding token:', error);
      throw new UnauthorizedException('Invalid token');
    }
  }

  @Post('database')
  @ApiOperation({
    summary: 'Create a new Database Policy',
    description: 'Creates a new policy for managing databases.',
  })
  createPolicyDB(
    @Request() req: RequestWithCookies,
    @Body() policyData: AzureDBPolicyDto,
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
      return this.policyService.createPolicyDB(payload, policyData);
    } catch (error) {
      console.error('Error decoding token:', error);
      throw new UnauthorizedException('Invalid token');
    }
  }

  @Post('storage')
  @ApiOperation({
    summary: 'Create a new Storage Policy',
    description: 'Creates a new policy for managing storage resources.',
  })
  createPolicyST(
    @Request() req: RequestWithCookies,
    @Body() policyData: AzureSTPolicyDto,
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
      return this.policyService.createPolicyST(payload, policyData);
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
    @Body() policyData: AzureVMPolicyDto,
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
      return this.policyService.updatePolicyVM(payload, policyData);
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
    @Body() policyData: AzureDBPolicyDto,
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
      return this.policyService.updatePolicyDB(payload, policyData);
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
    @Body() policyData: AzureSTPolicyDto,
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
      return this.policyService.updatePolicyST(payload, policyData);
    } catch (error) {
      console.error('Error decoding token:', error);
      throw new UnauthorizedException('Invalid token');
    }
  }

  @Get('virtual_machine')
  @ApiOperation({
    summary: 'Get all Virtual Machine Policies',
    description: 'Retrieves all policies for virtual machines.',
  })
  @ApiResponse({
    status: 200,
    description: 'VM policies retrieved successfully',
  })
  getPolicyVMAzure(@Request() req: RequestWithCookies) {
    const token = req.cookies?.['access_token'];
    if (token === undefined) {
      throw new UnauthorizedException('No access token');
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET not defined');
    }

    try {
      return this.policyService.getPolicyVMAzure();
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
      return this.policyService.getPolicyDBAzure();
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
      return this.policyService.getPolicySTAzure();
    } catch (error) {
      console.error('Error decoding token:', error);
      throw new UnauthorizedException('Invalid token');
    }
  }

  @Get('cluster')
  @ApiOperation({
    summary: 'Get all Cluster Policies',
    description: 'Retrieves all policies for Cluster.',
  })
  @ApiResponse({
    status: 200,
    description: 'Cluster policies retrieved successfully',
  })
  getPolicyClusterAzure(@Request() req: RequestWithCookies) {
    const token = req.cookies?.['access_token'];
    if (token === undefined) {
      throw new UnauthorizedException('No access token');
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET not defined');
    }

    try {
      return this.policyService.getPolicyClusterAzure();
    } catch (error) {
      console.error('Error decoding token:', error);
      throw new UnauthorizedException('Invalid token');
    }
  }
}
