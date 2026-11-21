import { NestFactory } from '@nestjs/core';
import { AppModule} from './app.module.js';
import { SERVICE_PORTS } from '@app/common/constants/index.js';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    })
  )
  await app.listen(SERVICE_PORTS.API_GATEWAY);
  console.log(`API Gateway is running on: http://localhost:${SERVICE_PORTS.API_GATEWAY}`);
}
await bootstrap();
