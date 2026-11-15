import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { createRequire } from 'node:module';
import type { RequestHandler } from 'express';
import { AppModule } from './app.module.js';

const require = createRequire(import.meta.url);
const helmet = require('helmet') as () => RequestHandler;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );

  const config = new DocumentBuilder()
    .setTitle('ZeroWaste API')
    .setDescription('Food rescue network')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('', app, SwaggerModule.createDocument(app, config));

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();