import { Module } from '@nestjs/common';
import { NotificationServiceController } from './notification-service.controller.js';
import { NotificationServiceService } from './notification-service.service.js';
import { EmailService } from './email.service.js';

@Module({
  controllers: [NotificationServiceController],
  providers: [NotificationServiceService, EmailService],
})
export class NotificationServiceModule {}
