import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false, // Disable default body parser
  });
  
  // Set up body parser with larger size limit for image uploads (50MB)
  const express = require('express');
  const expressInstance = app.getHttpAdapter().getInstance();
  expressInstance.use(express.json({ limit: '50mb' }));
  expressInstance.use(express.urlencoded({ extended: true, limit: '50mb' }));
  
  // Enable CORS for React frontend
  app.enableCors({
    origin: 'http://localhost:3000',
    credentials: true,
  });
  
  await app.listen(3001);
  console.log('Application is running on: http://localhost:3001');
}
bootstrap();

