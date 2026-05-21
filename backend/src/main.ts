import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import helmet from 'helmet';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security: Enable Helmet to set security-related HTTP headers
  app.use(helmet());

  // Security: Enable strict CORS (Cross-Origin Resource Sharing)
  // This prevents unauthorized domains from calling our API
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || 'http://localhost:3000', // Update this in production
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true, // Allow cookies if we use them later
  });

  // API prefix
  app.setGlobalPrefix('api');

  // Global request validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Get port
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 4000;

  // Start server
  await app.listen(port);

  console.log(`Server running on http://localhost:${port}/api`);
}

bootstrap();