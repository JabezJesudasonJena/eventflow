import { NestFactory } from '@nestjs/core';
import { TicketsServiceModule } from './tickets-service.module.js';
import { SERVICE_PORTS } from '@app/common';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(TicketsServiceModule);
  
  // Global Pipe Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(SERVICE_PORTS.TICKETS_SERVICE);
  console.log(
    `Tickets Service is running on: http://localhost:${SERVICE_PORTS.TICKETS_SERVICE}`
  )
}
await bootstrap();
