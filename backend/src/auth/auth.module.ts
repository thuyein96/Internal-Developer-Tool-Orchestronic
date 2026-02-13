import { Module } from '@nestjs/common';
import { UserModule } from '../user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategies/jwt.strategy';
import { DatabaseService } from '../database/database.service';
import { AuthController } from './auth.controller';
import { PassportModule } from '@nestjs/passport';
import { AzureStrategy } from './strategies/azure-ad.strategy';

@Module({
  imports: [
    PassportModule.register({
      defaultStrategy: 'azure-ad',
    }),
    JwtModule.register({
      secret: 'eSo3PoOYP7BhJFaqfnsKz52mo3cpV1vb3M38IGzaFt4=',
      signOptions: { expiresIn: '1h' },
    }),
    UserModule,
  ],
  providers: [JwtStrategy, DatabaseService, AzureStrategy],
  controllers: [AuthController],
  exports: [JwtStrategy],
})
export class AuthModule {}
