import { NestFactory } from '@nestjs/core';
import { NotificationServiceModule } from './notification-service.module.js';
import { Transport } from '@nestjs/microservices';
import { KAFKA_CLIENT_ID, KAFKA_BROKER} from '@app/kafka/constants/index.js';
import { SERVICE_PORTS } from '@app/common/constants/index.js';
import{ MicroserviceOptions } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(NotificationServiceModule);
  // connect kafka microservices  for consuming events from other services
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: `${KAFKA_CLIENT_ID}--notifications`,
        brokers: [KAFKA_BROKER],
      },
      consumer: {
        groupId: `notfications-consumer-group`
      }
    }
  });

  // start all microservice  (kafka consumer) 
  await app.startAllMicroservices();
  await app.listen(SERVICE_PORTS.NOTIFICATIONS_SERVICE);
  console.log(
    `Notification service is running on port ${SERVICE_PORTS.NOTIFICATIONS_SERVICE}`
  )
  
  console.log('Kafka consumer started');
}
await bootstrap();
