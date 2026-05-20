import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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