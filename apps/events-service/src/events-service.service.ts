import { ForbiddenException, Injectable } from '@nestjs/common';
import { OnModuleInit, NotFoundException, UnauthorizedException} from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { KAFKA_SERVICE } from '@app/kafka';
import { DatabaseService, events, evnetStatusEnum } from '@app/database';
import { CreateEventDto, UpdateEventDto} from '@app/common';
import {KAFKA_TOPICS} from '@app/kafka/constants/index.js';
import { eq } from 'drizzle-orm';

@Injectable()
export class EventsServiceService implements OnModuleInit {
  constructor(
    @Inject(KAFKA_SERVICE) private readonly kafkaClient: ClientKafka,
    private readonly dbService: DatabaseService
  ){}

  async onModuleInit() {
    await this.kafkaClient.connect();
  }

  async createEvent(createEventDto: CreateEventDto, organizerId: string) {
    const [event] = await this.dbService.db
      .insert(events)
      .values({
        ...createEventDto,
        organizerId,
        date: new Date(createEventDto.date)
      })
      .returning();
    
    this.kafkaClient.emit(KAFKA_TOPICS.EVENT_CREATED, {
      eventId: event.id,
      organizerId: event.organizerId,
      title: event.title,
      timestamp: new Date().toISOString(),
    });

    return event;
  };

  async findAll() {
    return await this.dbService.db.select().from(events).where(eq(events.status, 'PUBLISHED'));
    
  }

  async getEventById(eventId: string) {
    const [event] =  await this.dbService.db.select().from(events).where(eq(events.id, eventId)).limit(1);
    if(!event) {
      throw new NotFoundException(`Event with id ${eventId} not found`);
    }
    return event;
  }

  async update(
    id: string, 
    updateEventDto: UpdateEventDto,
    userId: string,
    userRole: string
  ) {
    const event = await this.getEventById(id);
    if(event.organizerId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException('You are not authorized to update this event');
    }

    const updatedData: Record<string, any> = {...updateEventDto};
    if(updateEventDto.date) {
      // Here the date is forwarded from the client 
      // So it is required to convert it from string -> Date object before saving to the database
      updatedData.date = new Date(updateEventDto.date);
    }
    // Returns the current Date in a Date obejct format
    updatedData.updatedAt = new Date();
    
    const [updatedEvent] = await this.dbService.db
      .update(events)
      .set(updatedData)
      .where(eq(events.id, id))
      .returning();
    this.kafkaClient.emit(KAFKA_TOPICS.EVENT_UPDATED, {
      eventId: updatedEvent.id,
      // Object.keys() are used to return the keys but not the corresponding values 
      changes: Object.keys(updatedData),
      timestamp: new Date().toISOString(),
    });

    return updatedEvent;
  }


  async publish(id: string, userId: string, userRole: string) {
    const event = await this.getEventById(id);
    if(event.organizerId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException('You are not authorized to publish this event');
    }

    const [publishedEvent] = await this.dbService.db
      .update(events)
      .set({ status: 'PUBLISHED', updatedAt: new Date() })
      .where(eq(events.id, id))
      .returning();
    //  No kafka event published as there is no kafka topic for this 
    return publishedEvent;
  }

  async cancel (id: string, userId: string, userRole: string) {
    const event = await this.getEventById(id);
    if(event.organizerId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException('You are not authorized to cancel this event');
    }

    const [cancelledEvent] = await this.dbService.db
      .update(events)
      .set({ status: 'CANCELLED', updatedAt: new Date() })
      .where(eq(events.id, id))
      .returning();
    this.kafkaClient.emit(KAFKA_TOPICS.EVENT_CANCELLED, {
      eventId: cancelledEvent.id,
      organizerId: cancelledEvent.organizerId,
      timestamp: new Date().toISOString(),
    })
    return cancelledEvent;
  }

  async findMyEvents(userId: string) {
    return await this.dbService.db.select().from(events).where(eq(events.organizerId, userId));
  }
}
