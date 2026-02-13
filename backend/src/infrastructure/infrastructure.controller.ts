import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UnauthorizedException,
  Req,
} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { InfrastructureService } from './infrastructure.service';
import { CreateInfrastructureDto } from './dto/create-infrastructure.dto';
import { UpdateInfrastructureDto } from './dto/update-infrastructure.dto';
import { BackendJwtPayload, RequestWithCookies } from '../lib/types';

@Controller('infrastructure')
export class InfrastructureController {
  constructor(private readonly infrastructureService: InfrastructureService) {}

  @Post()
  create(@Body() createInfrastructureDto: CreateInfrastructureDto) {
    return this.infrastructureService.create(createInfrastructureDto);
  }

  @Get()
  findAll() {
    return this.infrastructureService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.infrastructureService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateInfrastructureDto: UpdateInfrastructureDto,
  ) {
    return this.infrastructureService.update(+id, updateInfrastructureDto);
  }

  @Delete(':id/infra-destroy')
  azureDestroy(@Param('id') id: string, @Req() req: RequestWithCookies) {
    // console.log('Infrastructure Controller: infra-destroy called, id=', id);
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
      return this.infrastructureService.infrastrutureDestroy(payload, id);
    } catch (err) {
      console.error('Request Controller: Error decoding token', err);
      throw new UnauthorizedException('Invalid token');
    }
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.infrastructureService.remove(+id);
  }
}
