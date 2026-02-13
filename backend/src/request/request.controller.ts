import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Request,
  UnauthorizedException,
} from '@nestjs/common';
import { RequestService } from './request.service';
import { Status } from '@prisma/client';
import { ApiBody, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { CreateAzureRequestDto } from './dto/create-request-azure.dto';
import * as jwt from 'jsonwebtoken';
import { UpdateRequestStatusDto } from './dto/request-status.dto';
import { BackendJwtPayload, RequestWithCookies } from '../lib/types';
import { GetVmSizesDto } from './dto/get-vm-sizes.dto';
import { PaginatedVmSizesDto } from './dto/paginated-vm-sizes.dto';
import { UpdateFeedbackDto } from './dto/update-feedback.dto';
import { GitlabService } from '../gitlab/gitlab.service';
import { CreateAwsRequestDto } from './dto/create-request-aws.dto';

@Controller('request')
export class RequestController {
  constructor(
    private readonly requestService: RequestService,
    private readonly gitlabService: GitlabService,
  ) {}

  @Get()
  findAll(@Req() req: RequestWithCookies) {
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
      return this.requestService.findAll(payload);
    } catch (err) {
      console.error('Request Controller: Error decoding token', err);
      throw new UnauthorizedException('Invalid token');
    }
  }

  @Get('status')
  @ApiOperation({
    summary: 'Find requests by status',
  })
  @ApiQuery({ name: 'status', enum: Status })
  findByStatus(@Query('status') status: Status) {
    return this.requestService.findByStatus(status);
  }

  @ApiOperation({
    summary: 'Get available VM sizes',
    description:
      'Retrieves a list of available VM sizes from Azure with pagination and filtering',
  })
  @ApiResponse({
    status: 200,
    description: 'VM sizes retrieved successfully',
    type: PaginatedVmSizesDto,
  })
  @Get('vm-sizes')
  @ApiOperation({
    summary: 'Get available VM sizes with pagination and filtering',
  })
  getVmSizes(@Query() query: GetVmSizesDto) {
    return this.requestService.getVmSizesPaginated(query);
  }

  @Get('displayCode')
  @ApiOperation({
    summary: 'Find requests by display code',
  })
  @ApiQuery({
    name: 'displayCode',
    description: 'Format: R-[number]',
    required: true,
  })
  async findWithRequestDisplayCode(
    @Query('displayCode') displayCode: string,
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

    if (!/^R-\d+$/.test(displayCode)) {
      throw new BadRequestException(
        'Invalid displayCode format. Expected format: R-<number>',
      );
    }

    try {
      const decoded = jwt.verify(token, secret) as unknown;
      const payload = decoded as BackendJwtPayload;
      return this.requestService.findWithRequestDisplayCode(
        displayCode,
        payload,
      );
    } catch {
      console.error('Request Controller: Error decoding token');
      throw new Error('Invalid token - unable to process');
    }
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Find a request by ID',
  })
  findById(@Param('id') id: string) {
    return this.requestService.findById(+id);
  }

  @Post('/azure')
  @ApiOperation({
    summary: 'Create a new request Azure',
  })
  @ApiBody({ type: CreateAzureRequestDto })
  async createRequestAzure(
    @Request() req: RequestWithCookies,
    @Body() request: CreateAzureRequestDto,
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
      return this.requestService.createRequestAzure(request, payload);
    } catch {
      console.error('Request Controller: Error decoding token');
      throw new Error('Invalid token - unable to process');
    }
  }

  @Post('/aws')
  @ApiOperation({
    summary: 'Create a new request Aws',
  })
  @ApiBody({ type: CreateAwsRequestDto })
  async createRequestAws(
    @Request() req: RequestWithCookies,
    @Body() request: CreateAwsRequestDto,
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
      return this.requestService.createRequestAws(request, payload);
    } catch {
      console.error('Request Controller: Error decoding token');
      throw new Error('Invalid token - unable to process');
    }
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Update request status by request ID',
  })
  updateRequestStatus(
    @Param('id') id: string,
    @Body() { status }: UpdateRequestStatusDto,
    @Req() req: RequestWithCookies,
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
      return this.requestService.updateRequestInfo(payload, id, status);
    } catch (err) {
      console.error('Request Controller: Error decoding token', err);
      throw new UnauthorizedException('Invalid token');
    }
  }

  // @Patch(':id/status')
  // @ApiOperation({
  //   summary: 'Update request status by request ID',
  // })
  // async updateRequestStatus(
  //   @Param('id') id: string,
  //   @Body() { status }: UpdateRequestStatusDto,
  //   @Req() req: RequestWithCookies,
  // ) {
  //   const token = req.cookies?.['access_token'];
  //   if (token === undefined) {
  //     throw new UnauthorizedException('No access token');
  //   }

  //   const secret = process.env.JWT_SECRET;
  //   if (!secret) {
  //     throw new Error('JWT_SECRET not defined');
  //   }

  //   const decoded = jwt.verify(token, secret) as unknown;
  //   const payload = decoded as BackendJwtPayload;

  //   if (payload.role !== 'Admin' && payload.role !== 'IT') {
  //     throw new ForbiddenException(
  //       'You do not have permission to update status',
  //     );
  //   }
  //   const updated = await this.requestService.updateRequestInfo(payload, id, {
  //     status,
  //   });

  //   if (updated.status === RequestStatus.Approved) {
  //     await this.gitlabService.createProject({
  //       name: updated.repository.name,
  //       description: updated.repository.description || '',
  //       visibility: 'public',
  //     });
  //   }

  //   if (!updated) {
  //     throw new NotFoundException(`Request with id ${id} not found`);
  //   }

  //   return updated;
  // }

  @Patch(':id/feedback')
  @ApiOperation({
    summary: 'Update request feedback by request ID',
  })
  updateRequestFeedback(
    @Param('id') id: string,
    @Body() feedback: UpdateFeedbackDto,
    @Req() req: RequestWithCookies,
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

      if (!payload) {
        throw new UnauthorizedException('User not authenticated');
      }

      if (payload.role !== 'Admin' && payload.role !== 'IT') {
        throw new ForbiddenException(
          'You do not have permission to update feedback',
        );
      }

      return this.requestService.updateRequestFeedback(id, feedback.feedback);
    } catch (error) {
      console.error('Request Controller: Error decoding token', error);
      throw new UnauthorizedException('Invalid token - unable to process');
    }
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a request by ID',
  })
  removeRequest(@Param('id') id: string) {
    return this.requestService.removeRequest(id);
  }
}
