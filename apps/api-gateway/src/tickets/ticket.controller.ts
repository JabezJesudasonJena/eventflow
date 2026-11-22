import {Controller, Get, Param, Post, Body, Inject, UseGuards, Request} from '@nestjs/common';
import {AuthGuard} from '@nestjs/passport';
import {TicketsServiceService} from './ticket.service.js';
import {PurchaseTicketDto} from '@app/common/dto/purchase-ticket.dto.js';

@Controller('tickets')
export class TicketsController {
    constructor(
        private readonly ticketsService: TicketsServiceService
    ) {}

    @UseGuards(AuthGuard('jwt'))
    @Post('purchase')
    purchaseTicket(
        @Body() purchaseData: PurchaseTicketDto,
        @Request() req: {user: {userId: string}} 
    ) {
        return this.ticketsService.purchaseTicket(purchaseData, req.user.userId);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('mytickets')
    findMyTickets(
        @Request() req: {user: {userId: string}} 
    ) {
        return this.ticketsService.myTickets(req.user.userId);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get(':ticketCode')
    findOne(
        @Param('ticketCode') ticketCode: string,
        @Request() req: {user: {userId: string}} 
    ) {
        return this.ticketsService.findOne(req.user.userId, ticketCode);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('cancel/:ticketCode')
    cancelTicket(
        @Param('ticketCode') ticketCode: string,
        @Request() req: {user: {userId: string}}
    ) {
        return this.ticketsService.cancelTicket(req.user.userId, ticketCode);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('checkin/:ticketCode')
    checkInTicket(
        @Param('ticketCode') ticketCode: string,
        @Request() req: {user: {userId: string}}
    ) {
        return this.ticketsService.checkInTicket(req.user.userId, ticketCode);
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('event/:eventId')
    findEventTickets(
        @Param('eventId') eventId: string,
        @Request() req: {user: {userId: string}}
    ) {
        return this.ticketsService.findEventTickets(req.user.userId, eventId);
    }
}