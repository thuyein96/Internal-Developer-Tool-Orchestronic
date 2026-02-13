import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class RabbitmqService {
  constructor(
    @Inject('RABBITMQ_SERVICE_1') private rabbitClient1: ClientProxy,
    @Inject('RABBITMQ_SERVICE_2') private rabbitClient2: ClientProxy,
    @Inject('RABBITMQ_SERVICE_3') private rabbitClient3: ClientProxy,
    @Inject('RABBITMQ_SERVICE_4') private rabbitClient4: ClientProxy,
  ) {}

  queueRequest(requestId: string) {
    this.rabbitClient1.emit('request', { requestId });
    console.log(`(Queue) Request ID sent to RabbitMQ: ${requestId}`);

    return { message: 'Queue Request queued successfully', requestId };
  }

  destroyRequest(requestId: string) {
    this.rabbitClient2.emit('destroy', { requestId });
    console.log(`(Destroy) Request ID sent to RabbitMQ: ${requestId}`);

    return { message: 'Destroy Request queued successfully', requestId };
  }

  destroyK8sRequest(resourceId: string) {
    this.rabbitClient4.emit('destroyK8s', { resourceId });
    console.log(`(Destroy K8s) Resource ID sent to RabbitMQ: ${resourceId}`);

    return { message: 'Destroy K8s Request queued successfully', resourceId };
  }

  queueResource(resourceId: string) {
    this.rabbitClient3.emit('resource', { resourceId });
    console.log(`(Queue) Resource ID sent to RabbitMQ: ${resourceId}`);

    return { message: 'Queue Resource queued successfully', resourceId };
  }

  // async getRequest() {
  //   try {
  //     const response = await lastValueFrom(
  //       this.rabbitClient.send('request', {}).pipe(timeout(10000)),
  //     );
  //     return response;
  //   } catch (err) {
  //     console.error('Timeout or error:', err);
  //     throw err; // optional: rethrow or return fallback
  //   }
  // }
}
