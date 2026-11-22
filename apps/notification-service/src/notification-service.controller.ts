import { Controller, Get, Logger } from '@nestjs/common';
import { NotificationServiceService } from './notification-service.service.js';
import { EventPattern, Payload } from '@nestjs/microservices';
import { KAFKA_TOPICS } from '@app/kafka/constants/index.js';

@Controller()
export class NotificationServiceController {
  private readonly logger = new Logger(NotificationServiceController.name);
  constructor(private readonly notificationServiceService: NotificationServiceService) {}

  @Get('health')
  healthCheck(): { status: string; service: string } {
    this.logger.log('Health check endpoint called');
    return {
      status: 'ok',
      service: 'notfication-service',
    };
  }

  @EventPattern(KAFKA_TOPICS.USER_REGISTERED)
  async handleUserRegisteredEvent(
    @Payload() data: { userId: string; email: string; name: string }
  ) {
    this.logger.log(`Received user registered event for user ${data.userId}`);
    await this.notificationServiceService.sendWelcomeEmail(data);
  }

  @EventPattern(KAFKA_TOPICS.TICKET_PURCHASED)
  async handleTicketPurchasedEvent(
    @Payload() data: { 
      ticketCode: string;
      userId: string;
      ticketId: string;
      quantity: number;
      totalPrice: number;
      eventId: string;
    }
  ) {
    this.logger.log(`Received ticket purchased event for ticket ${data.ticketId} with code ${data.ticketCode}`);
    await this.notificationServiceService.sendTicketPurchaseConfirmationEmail(data);
  }

  @EventPattern(KAFKA_TOPICS.EVENT_CANCELLED)
  async handleEventCancelledEvent(
    @Payload() data: {
      eventId: string;
      eventTitle?: string;
      organizerId: string;
      ticketCode?: string;
    }
  ) {
    this.logger.log(`Received event cancelled event for event ${data.eventId}`);
    this.notificationServiceService.sendEventCancellationEmail(data);
  }





}
