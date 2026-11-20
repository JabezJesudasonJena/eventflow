import { KAFKA_SERVICE} from '@app/kafka';
import { KAFKA_TOPICS } from '@app/kafka/constants/index.js';
import { Injectable } from '@nestjs/common';
import { OnModuleInit, Inject } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';

@Injectable()
export class AuthServiceService implements OnModuleInit {
  constructor(
    @Inject(KAFKA_SERVICE) private readonly KafkaClient: ClientKafka
  ) {}

  async onModuleInit() {
    await this.KafkaClient.connect();
  }

  getHello(): string {
    return 'Hello World!';
  }

  async stimulateUserRegistration(email: string)  {
    // Publish event to Kafka topics 'user.registered'
    await this.KafkaClient.emit(KAFKA_TOPICS.USER_REGISTERED, {
      email,
      timestamp: new Date().toISOString(),
    });

    return {
      mesage: `User registered with email: ${email}. Event published to Kafka topic '${KAFKA_TOPICS.USER_REGISTERED}'`,
    };
  }
}

