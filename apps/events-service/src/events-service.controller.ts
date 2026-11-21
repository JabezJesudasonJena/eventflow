import { Controller, Get, Post, Body, Request, Headers, Param, Put } from '@nestjs/common';
import { EventsServiceService } from './events-service.service.js';
import { CreateEventDto, UpdateEventDto } from '@app/common';

@Controller()
export class EventsServiceController {
  constructor(private readonly eventsServiceService: EventsServiceService) {}
  
  @Post()
  create(
    @Body() dto: CreateEventDto,
    @Headers('x-user-id') userId: string,
  ){
    return this.eventsServiceService.createEvent(dto, userId);
  }

  @Get()
  findAll() {
    return this.eventsServiceService.findAll();
  }

  @Get('my-events')
  findMyEvents(@Headers('x-user-id') userId: string) {
    return this.eventsServiceService.findMyEvents(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.eventsServiceService.getEventById(id);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateEventDto: UpdateEventDto,
    @Headers('x-user-id') userId: string,
    @Headers('x-user-role') userRole: string
  ) {
    return this.eventsServiceService.update(id, updateEventDto, userId, userRole);
  }

  @Post(':id/publish')
  publish(
    @Param('id') id: string,
    @Headers('x-user-id') userId: string,
    @Headers('x-user-role') userRole: string
  ) {
    return this.eventsServiceService.publish(id, userId, userRole);
  }

  @Post(':id/cancel')
  cancel(
    @Param('id') id: string,
    @Headers('x-user-id') userId: string,
    @Headers('x-user-role') userRole: string
  ) {
    return this.eventsServiceService.cancel(id, userId, userRole);
  }

}