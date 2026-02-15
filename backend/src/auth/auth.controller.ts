import { Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import { BackendJwtPayload, RequestWithCookies } from '../lib/types';
import * as jwt from 'jsonwebtoken';

@Controller('auth')
export class AuthController {
  constructor(private jwt: JwtService) {}

  @Get('test-login')
  testLogin(@Res() res: Response) {
    const isProd = process.env.NODE_ENV === 'production';
    const accessToken = this.jwt.sign(
      { sub: '123', role: 'Admin' },
      { expiresIn: '1h' },
    );
    const refreshToken = this.jwt.sign({ sub: '123' }, { expiresIn: '7d' });

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: isProd, // for Postman / localhost
      sameSite: isProd ? 'none' : 'lax',
      maxAge: 60 * 60 * 1000,
    });

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({ message: 'Cookies set' });
  }

  @Get('azure')
  @UseGuards(AuthGuard('azure-ad'))
  async azureLogin() {
    // passport redirect to Azure
  }

  @Get('azure/callback')
  @UseGuards(AuthGuard('azure-ad'))
  azureCallback(@Req() req, @Res() res: Response) {
    const isProd = process.env.NODE_ENV === 'production';
    const cookieDomain = process.env.COOKIE_DOMAIN; // e.g. '.gitlaborchestronic.dev'

    try {
      console.log('Azure callback - Req.user:', req.user);
      const user = req.user;

      if (!user || !user.id || !user.email) {
        console.error('Invalid user data from Azure AD:', user);
        return res.redirect(
          `${process.env.FRONTEND_URL}/login?error=invalid_user`,
        );
      }

      // Create JWT payload with all required fields
      const jwtPayload = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      };

      // Issue short-lived access token
      const accessToken = this.jwt.sign(jwtPayload, { expiresIn: '1h' });

      // Issue refresh token
      const refreshToken = this.jwt.sign({ id: user.id }, { expiresIn: '7d' });

      // Set cookies with proper configuration
      // domain must be set to share cookies across subdomains (api.* and app.*)
      const cookieOptions = {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? ('none' as const) : ('lax' as const),
        path: '/',
        ...(cookieDomain ? { domain: cookieDomain } : {}),
      };

      res.cookie('access_token', accessToken, {
        ...cookieOptions,
        maxAge: 60 * 60 * 1000, // 1 hour
      });

      res.cookie('refresh_token', refreshToken, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      console.log('Cookies set successfully, redirecting to dashboard');

      // Redirect to frontend dashboard
      return res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
    } catch (error) {
      console.error('Error in Azure callback:', error);
      return res.redirect(
        `${process.env.FRONTEND_URL}/login?error=auth_failed`,
      );
    }
  }

  @Post('refresh')
  refresh(@Req() req: RequestWithCookies, @Res() res: Response) {
    const isProd = process.env.NODE_ENV === 'production';
    const cookieDomain = process.env.COOKIE_DOMAIN;

    const refreshToken = req.cookies['refresh_token'];

    if (!refreshToken) {
      return res.status(401).json({ message: 'No refresh token' });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET not defined');
    }

    try {
      const decoded = jwt.verify(refreshToken, secret) as unknown;
      const payload = decoded as BackendJwtPayload;

      // Issue new short-lived access token
      const accessToken = this.jwt.sign(
        { id: payload.id },
        { expiresIn: '1h' },
      );

      res.cookie('access_token', accessToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? 'none' : 'lax',
        maxAge: 60 * 60 * 1000, // 1 hour
        path: '/',
        ...(cookieDomain ? { domain: cookieDomain } : {}),
      });

      return res.json({ accessToken });
    } catch {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }
  }

  // Backend: auth.controller.ts
  @Post('logout')
  logout(@Res() res: Response) {
    const isProd = process.env.NODE_ENV === 'production';
    const cookieDomain = process.env.COOKIE_DOMAIN;

    // Clear application cookies
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      path: '/',
      ...(cookieDomain ? { domain: cookieDomain } : {}),
    });

    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      path: '/',
      ...(cookieDomain ? { domain: cookieDomain } : {}),
    });

    // Azure AD logout with prompt parameter
    const tenantId = process.env.AZURE_AD_TENANT_ID;
    const redirectUri = encodeURIComponent(process.env.FRONTEND_URL + '/login');

    // Add prompt=select_account to the redirect URI so after Azure logout,
    // users will see account picker on next login
    const logoutUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/logout?post_logout_redirect_uri=${redirectUri}`;

    return res.status(200).json({
      message: 'Logged out',
      logoutUrl,
    });
  }
}
