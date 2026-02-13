import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { BackendJwtPayload } from '../../lib/types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: 'eSo3PoOYP7BhJFaqfnsKz52mo3cpV1vb3M38IGzaFt4=',
    });
  }

  validate(payload: BackendJwtPayload) {
    return {
      email: payload.email,
      name: payload.name,
      id: payload.id,
      role: payload.role,
    };
  }
}
