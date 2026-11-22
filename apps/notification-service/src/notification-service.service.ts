import { Injectable, Logger } from '@nestjs/common';
import { EmailService } from './email.service.js';

@Injectable()
export class NotificationServiceService {
  private readonly Logger = new Logger(NotificationServiceService.name);
  constructor(private readonly emailService: EmailService) {}

  async sendWelcomeEmail(
    data: {
      userId: string;
      email: string;
      name: string;
    }
  ){
    this.Logger.log(`Sending welcome email to user ${data.userId} with email ${data.email}`);
    const html = `
      <h1>Welcome to EventFlowApp, ${data.name}!</h1>
      <p>We're excited to have you on board. Get ready to explore and enjoy our platform!</p>
      <p>Best regards,<br/>The EventFlowApp Team</p>
    `
    await this.emailService.sendEmail(data.email, 'Welcome to EventFlowApp', html);
    
  }

  async sendTicketPurchaseConfirmationEmail(
    data: {userId: string, email?: string, ticketCode: string, eventTitle?: string, quantity: number, totalPrice: number}
  ){
    data.email = data.email || 'user@example.com'
    this.Logger.log(`Sending ticket purchase confirmation email to user ${data.userId} with email ${data.email}`);
    const html = `
      <h1>Ticket Purchase Confirmation</h1>
      <p>Thank you for your purchase! Here are your ticket details:</p>
      <ul>
        <li><strong>Event:</strong> ${data.eventTitle || 'N/A'}</li>
        <li><strong>Ticket Code:</strong> ${data.ticketCode}</li>
        <li><strong>Quantity:</strong> ${data.quantity}</li>
        <li><strong>Total Price:</strong> $${data.totalPrice.toFixed(2)}</li>
      </ul>
      <p>Please keep this email for your records. We look forward to seeing you at the event!</p>
      <p>Best regards,<br/>The EventFlowApp Team</p>
    `
    await this.emailService.sendEmail(data.email || 'default@example.com', 'Your Ticket Purchase Confirmation', html);
  }

  sendEventCancellationEmail(data: {
    eventId: string;
    eventTitle?: string;
    organizerId: string;
  }){
    this.Logger.log(`Sending event cancellation notice for the event ${data.eventId} to organizer ${data.organizerId}`);
  }
}
