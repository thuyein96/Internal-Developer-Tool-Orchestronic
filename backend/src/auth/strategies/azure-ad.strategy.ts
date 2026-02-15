import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { OIDCStrategy } from 'passport-azure-ad';
import { DatabaseService } from '../../database/database.service';
import { Role } from '@prisma/client';

@Injectable()
export class AzureStrategy extends PassportStrategy(OIDCStrategy, 'azure-ad', true) {
  constructor(private readonly databaseService: DatabaseService) {
    super({
      identityMetadata: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/v2.0/.well-known/openid-configuration`,
      clientID: process.env.AZURE_AD_CLIENT_ID,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
      responseType: 'code',
      responseMode: 'query',
      redirectUrl: process.env.AZURE_AD_REDIRECT_URI,
      allowHttpForRedirectUrl: true,
      scope: ['profile', 'email', 'openid'],
      prompt: 'select_account',
      useCookieInsteadOfSession: true,
      cookieEncryptionKeys: [
        {
          key: (process.env.COOKIE_ENCRYPTION_KEY || 'eSo3PoOYP7BhJFaqfnsKz52m').substring(0, 32).padEnd(32, '0'),
          iv: (process.env.COOKIE_ENCRYPTION_IV || '7Bcapd+pLbw+').substring(0, 12).padEnd(12, '0'),
        },
      ],
    });
  }

  async validate(iss: string, sub: string, profile: any) {
    const email = profile._json.preferred_username;

    let user = await this.databaseService.user.findUnique({
      where: { email },
    });

    if (!user) {
      user = await this.databaseService.user.create({
        data: {
          email,
          name: profile._json.name,
          role: Role.Developer,
        },
      });
    }

    return user;
  }
}
