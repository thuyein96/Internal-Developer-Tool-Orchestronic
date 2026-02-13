import { Body, Controller, Get, Post } from '@nestjs/common';
import { RequestDto } from './dto/request.dto';
import { RabbitmqService } from './rabbitmq.service';
import { ApiOperation } from '@nestjs/swagger';
import { ResourceDto } from './dto/resource.dto';

@Controller('rabbitmq')
export class RabbitmqController {
  constructor(private readonly queueService: RabbitmqService) {}

  // @Get()
  // @ApiOperation({
  //   summary: 'Get the current request from the queue',
  // })
  // getQueueRequest() {
  //   return this.queueService.getRequest();
  // }

  @Post('queue')
  @ApiOperation({
    summary: 'Queue a new request',
  })
  queueRequest(@Body() requestDto: RequestDto) {
    return this.queueService.queueRequest(requestDto.requestId);
  }

  @Post('resource')
  @ApiOperation({
    summary: 'Queue a new resource',
  })
  queueResource(@Body() requestDto: ResourceDto) {
    return this.queueService.queueResource(requestDto.resourceId);
  }

  @Post('destroy')
  @ApiOperation({
    summary: 'Queue a new destroy request',
  })
  destroyRequest(@Body() requestDto: RequestDto) {
    return this.queueService.destroyRequest(requestDto.requestId);
  }

  @Post('destroyK8s')
  @ApiOperation({
    summary: 'Queue a new destroy K8s request',
  })
  destroyK8sRequest(@Body() resourceDto: ResourceDto) {
    return this.queueService.destroyK8sRequest(resourceDto.resourceId);
  }
}
