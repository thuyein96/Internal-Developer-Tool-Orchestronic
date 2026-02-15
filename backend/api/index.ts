import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { INestApplication } from '@nestjs/common';

let app: INestApplication;

async function createNestApp() {
  if (app) return app;

  const nestApp = await NestFactory.create(AppModule);
  nestApp.use(cookieParser());
  nestApp.setGlobalPrefix('api');

  const isProd = process.env.NODE_ENV === 'production';

  nestApp.use(
    session({
      secret: process.env.SESSION_SECRET || 'supersecret',
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: isProd,
        sameSite: isProd ? ('none' as const) : ('lax' as const),
        ...(process.env.COOKIE_DOMAIN ? { domain: process.env.COOKIE_DOMAIN } : {}),
      },
    }),
  );

  nestApp.enableCors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  });

  nestApp.useGlobalPipes(new ValidationPipe());

  const config = new DocumentBuilder()
    .setTitle('Orchestronic API')
    .setDescription('API documentation for Orchestronic')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        in: 'header',
      },
      'access-token',
    )
    .setVersion('1.0')
    .build();

  const documentFactory = () => SwaggerModule.createDocument(nestApp, config);
  SwaggerModule.setup('docs', nestApp, documentFactory, {
    customSiteTitle: 'Orchestronic API',
    customfavIcon: 'https://avatars.githubusercontent.com/u/6936373?s=200&v=4',
    useGlobalPrefix: false,
  });

  await nestApp.init();
  app = nestApp;
  return app;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const app = await createNestApp();
  const expressApp = app.getHttpAdapter().getInstance();
  return expressApp(req, res);
}
