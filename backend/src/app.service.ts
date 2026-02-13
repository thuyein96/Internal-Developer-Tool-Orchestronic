import { Injectable } from '@nestjs/common';
import { RequestDto } from './rabbitmq/dto/request.dto';

@Injectable()
export class AppService {
  request: RequestDto[] = [];

  // handleRequest(data: any): { success: boolean; message: string } {
  //   console.log('Processing request:', data);

  //   // this.request.push(data);

  //   return {
  //     success: true,
  //     message: 'Request processed successfully',
  //   };
  // }

  getConnection(): { success: boolean; message: string } {
    return {
      success: true,
      message: 'Connection successful',
    };
  }
}
