import { Controller, Get, Post, Body, Param, Query, Headers, ParseUUIDPipe } from '@nestjs/common';
import { TicketsServiceService } from './tickets-service.service.js';
import { PurchaseTicketDto } from '@app/common/dto/purchase-ticket.dto.js';

@Controller()
export class TicketsServiceController {
  constructor(private readonly ticketsServiceService: TicketsServiceService) {}

  @Post('purchase')
  purchase(
    @Body() purchaseData: PurchaseTicketDto,
    @Headers('x-user-id') userId: string

  ){
    return this.ticketsServiceService.pruchaseTicket(purchaseData, userId); 
  }

  @Get('mytickets')
  findMyTickets(
    @Headers('x-user-id') userId: string
  ) {
    return this.ticketsServiceService.findMyTickets(userId);
  }


  @Get(':ticketCode')
  findOne(
    @Headers('x-user-id') userId: string,
    @Param('ticketCode', ParseUUIDPipe) ticketId: string
  ){
    return this.ticketsServiceService.findOne(ticketId, userId)
  }

  @Post('cancel/:ticketCode')
  cancel(
    @Headers('x-user-id') userId: string,
    @Param('ticketCode', ParseUUIDPipe) ticketId: string
  ){
    return this.ticketsServiceService.cancel(ticketId, userId);
  }

  @Post('checkin/:ticketCode')
  checkIn(
    @Headers('x-user-id') organizerId: string,
    @Param('ticketCode') ticketCode: string
  ){
    return this.ticketsServiceService.checkIn(ticketCode, organizerId);
  }

  @Get('event/:eventId')
  findEventTickets(
    @Headers('x-user-id') organizerId: string,
    @Param('eventId', ParseUUIDPipe) eventId: string
  ){
    return this.ticketsServiceService.findEventTickets(eventId, organizerId);
  }
}
