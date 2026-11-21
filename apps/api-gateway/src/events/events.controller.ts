import {Controller, Get, Post, Body, Param, Patch, Delete, UseGuards, Request, Injectable, ParseUUIDPipe, Put} from '@nestjs/common';
import { EventsService } from './events.service.js';
import { CreateEventDto, UpdateEventDto } from '@app/common';
import { AuthGuard } from '@nestjs/passport';

@Controller('events')
export class EventsController {
    constructor(private readonly eventsService: EventsService) {}

    @Get()
    findAll() {
        return this.eventsService.findAll();
    }

    // Protected route - get my events 
    @UseGuards(AuthGuard('jwt'))
    @Get('my-events')
    findMyEvents(@Request() req: {user: {userId: string}}) {
        return this.eventsService.findMyEvents(req.user.userId);           
    }

    // Public - get a single event by id
    @Get(':id')
    findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.eventsService.findOne(id);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post()
    create(
        @Body() data: CreateEventDto, 
        @Request() req: {user: {userId: string, role: string}}
    ) {
        return this.eventsService.create(data, req.user.userId, req.user.role);
    }

    @UseGuards(AuthGuard('jwt'))
    @Put(':id')
    update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() data: UpdateEventDto,
        @Request() req: {user: {userId: string, role: string}}
    ) {
        return this.eventsService.update(id, data, req.user.userId, req.user.role);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post(':id/publish')
    publish(
        @Param('id', ParseUUIDPipe) id: string,
        @Request() req: {user: {userId: string, role: string}}
    ) {
        return this.eventsService.publish(id, req.user.userId, req.user.role);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post(':id/cancel')
    cancel(
        @Param('id', ParseUUIDPipe) id: string,
        @Request() req: {user: {userId: string, role: string}}
    ) {
        return this.eventsService.cancel(id, req.user.userId, req.user.role);
    }

}