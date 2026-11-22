import { PurchaseTicketDto } from '@app/common/dto/index.js';
import { DatabaseService } from '@app/database/database.service.js';
import { KAFKA_SERVICE } from '@app/kafka/kafka.module.js';
import { Injectable, Inject, OnModuleInit, NotFoundException, BadRequestException, ForbiddenException} from '@nestjs/common';
import {ClientKafka} from '@nestjs/microservices';
import { randomBytes } from 'crypto';
import { and, desc, eq} from 'drizzle-orm';
import { events } from '@app/database';
import { sql } from 'drizzle-orm';
import { tickets } from '@app/database';
import {KAFKA_TOPICS} from '@app/kafka/constants/index.js';

@Injectable()
export class TicketsServiceService implements OnModuleInit {
  
  constructor(
    @Inject(KAFKA_SERVICE) private readonly kafkaClient: ClientKafka,
    private readonly dbService: DatabaseService
  ) {}

  async onModuleInit() {
    await this.kafkaClient.connect();
  }
  private generateTicketCode(): string {
    return randomBytes(6).toString('hex').toUpperCase();
  }

  async pruchaseTicket(purchaseData: PurchaseTicketDto, userId: string) {
    const {eventId, quantity} = purchaseData;
    const [event] = await this.dbService.db.select().from(events).where(eq(events.id, eventId)).limit(1);
    if(!event) {
      throw new NotFoundException('Event not found');
    }
    if(event.status == 'CANCELLED' ) {
      throw new BadRequestException('Event is cancelled');
    }
    if(event.status == 'DRAFT') {
      throw new BadRequestException('Event is not published yet');
    }
    // Check if the requested quantity exceeds the available tickets
    const soldTickets = await this.dbService.db
      .select({total: sql<number> `COALESCE(SUM(${tickets.quantity}), 0)`})
      .from(tickets)
      .where(
        and(eq(tickets.eventId, eventId), eq(tickets.status, 'CONFIRMED'))
      );

    const currentSold = Number(soldTickets[0]?.total || 0);
    const remaining = event.capacity - currentSold;
    if(quantity > remaining) {
      throw new BadRequestException(`Only ${remaining} tickets are available for this event`);
    }
    const totalPrice = event.price * quantity;
    const [ticket] = await this.dbService.db
      .insert(tickets)
      .values({
        eventId,
        userId,
        quantity,
        totalPrice,
        ticketCode: this.generateTicketCode(),
        status: 'CONFIRMED',
      })
      .returning();
    // Added eventTitle and ticketCode for the notification service to send a more informative email
    this.kafkaClient.emit(KAFKA_TOPICS.TICKET_PURCHASED, {
      id: ticket.id,
      ticketCode: ticket.ticketCode,
      eventTitle: event.title,
      eventId: ticket.eventId,
      userId: ticket.userId,
      quantity: ticket.quantity,
      totalPrice: ticket.totalPrice,
      timestamp: new Date().toISOString(),
    });

    return {
      message: 'Ticket purchased successfully',
      ticket: {
        id: ticket.id,
        ticketCode: ticket.ticketCode,
        eventTitle: event.title,
        quantity: ticket.quantity,
        status: ticket.status,
        purchasedAt: ticket.purchasedAt,
      }
    };
  }

  async findMyTickets(userId: string) {
    const userTickets = await this.dbService.db
      .select({
        ticketId: tickets.id,
        ticketCode: tickets.ticketCode,
        eventTitle: events.title,
        quantity: tickets.quantity,
        totalPrice: tickets.totalPrice,
        status: tickets.status,
        purchasedAt: tickets.purchasedAt,
      })
      .from(tickets)
      .innerJoin(events, eq(tickets.eventId, events.id))
      .where(eq(tickets.userId, userId))
      .orderBy(desc(tickets.purchasedAt));
    return userTickets;
  }

  async findOne(ticketId: string, userId: string) {
    const [ticket] = await this.dbService.db
      .select({
        ticketId: tickets.id,
        ticketCode: tickets.ticketCode,
        userId: tickets.userId,
        eventId: tickets.eventId,
        eventTitle: events.title,
        quantity: tickets.quantity,
        totalPrice: tickets.totalPrice,
        status: tickets.status,
        purchasedAt: tickets.purchasedAt,
      })
      .from(tickets)
      .innerJoin(events, eq(tickets.eventId, events.id))
      .where(and(eq(tickets.id, ticketId), eq(tickets.userId, userId)))
      .limit(1);
    if(!ticket){
      throw new NotFoundException(`Ticket with id ${ticketId} not found`);
    }

    if(ticket.userId !== userId) {
      throw new ForbiddenException('You are not authorized to view this ticket');
    }

    return ticket;
  }

  async cancel(ticketId: string, userId: string) {
    if(!ticketId || !userId) {
      throw new BadRequestException('Ticket ID and User ID are required');
    }
    const ticket = await this.dbService.db
      .select()
      .from(tickets)
      .where(eq(tickets.id, ticketId))
      .limit(1);
    if(!ticket || ticket.length === 0) {
      throw new NotFoundException(`Ticket with id ${ticketId} not found`);
    }
    if(ticket[0].userId !== userId) {
      throw new BadRequestException('You are not authorized to cancel this ticket');
    }
    if(ticket[0].status === 'CANCELLED') {
      throw new BadRequestException('Ticket is already cancelled');
    }
    if(ticket[0].status === 'CHECKED_IN') {
      throw new BadRequestException('Ticket has already been checked in and cannot be cancelled');
    }
    
    const [updatedTicket] = await this.dbService.db
      .update(tickets)
      .set({
        status: 'CANCELLED',
        updatedAt: new Date(),
      })
      .where(eq(tickets.id, ticketId))
      .returning();
    
    this.kafkaClient.emit(KAFKA_TOPICS.TICKET_CANCELLED, {
      id: updatedTicket.id,
      eventId: updatedTicket.eventId,
      userId: updatedTicket.userId,
      timestamp: new Date().toISOString(),
    });



    return {
      message: 'Ticket cancelled successfully'
    };
  }

  async checkIn(ticketCode: string, organizerId: string) {
    const ticket = await this.dbService.db
      .select()
      .from(tickets)
      .where(eq(tickets.ticketCode, ticketCode))
      .limit(1);
    if(!ticket || ticket.length === 0) {
      throw new NotFoundException(`Ticket with code ${ticketCode} not found`);
    }
    if(ticket[0].status === 'CANCELLED') {
      throw new BadRequestException('Ticket is cancelled and cannot be checked in');
    }
    if(ticket[0].status === 'CHECKED_IN') {
      throw new BadRequestException('Ticket has already been checked in');
    }

    const [event] = await this.dbService.db
      .select()
      .from(events)
      .where(eq(events.id, ticket[0].eventId))
      .limit(1);
    if(event.organizerId !== organizerId) {
      throw new ForbiddenException('You are not authorized to check in this ticket');
    }
    
    const [updatedTicket] = await this.dbService.db
      .update(tickets)
      .set({
        status: 'CHECKED_IN',
        updatedAt: new Date(),
      })
      .where(eq(tickets.ticketCode, ticketCode))
      .returning();
    this.kafkaClient.emit(KAFKA_TOPICS.TICKET_CHECKED_IN, {
      id: updatedTicket.id,
      eventId: updatedTicket.eventId,
      userId: updatedTicket.userId,
      timestamp: new Date().toISOString(),
    });
    return {
      message: 'Ticket checked in successfully',
      ticket: {
        id: updatedTicket.id,
        ticketCode: updatedTicket.ticketCode,
        quantity: updatedTicket.quantity,
        status: updatedTicket.status,
        checkedInAt: updatedTicket.updatedAt,
      }
    }
  }

  async findEventTickets(eventId: string, organizerId: string) {
    const [event] = await this.dbService.db
      .select()
      .from(events)
      .where(eq(events.id, eventId))
      .limit(1);
    if(!event) {
      throw new NotFoundException(`Event with id ${eventId} not found`);
    }
    if(event.organizerId !== organizerId) {
      throw new ForbiddenException('You are not authorized to view tickets for this event');
    }
    return await this.dbService.db
      .select()
      .from(tickets)
      .where(eq(tickets.eventId, eventId))
  }


}
