import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    console.log('🛡️ JWT Guard canActivate() called');
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers?.authorization;

    console.log('🔍 Authorization header:', authHeader ? 'Present' : 'Missing');
    if (authHeader) {
      console.log('🔑 Token preview:', authHeader.substring(0, 20) + '...');
    }

    const result = super.canActivate(context);
    console.log('⚡ Guard canActivate result:', result);
    return result;
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    console.log('🎯 JWT Guard handleRequest() called');
    console.log('❌ Error:', err);
    console.log('👤 User from strategy:', user);
    console.log('ℹ️ Info:', info);

    if (err || !user) {
      console.log('🚨 Authentication failed, throwing UnauthorizedException');
      throw err || new UnauthorizedException('Authentication failed');
    }

    console.log('✅ Authentication successful, user:', user);
    return user;
  }
}
