import { NestFactory } from '@nestjs/core';
import { EventsServiceModule } from './events-service.module.js';
import { SERVICE_PORTS } from '@app/common/constants/index.js';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(EventsServiceModule);
  // Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  )
  await app.listen(SERVICE_PORTS.EVENTS_SERVICE);
  
  console.log(
    `Events Service is running on port ${SERVICE_PORTS.EVENTS_SERVICE}`
  );
}
await bootstrap();
