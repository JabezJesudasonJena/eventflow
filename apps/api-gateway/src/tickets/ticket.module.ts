import {Module} from '@nestjs/common';
import {TicketsController} from './ticket.controller.js';
import {TicketsServiceService} from './ticket.service.js';
import {HttpModule} from '@nestjs/axios';

@Module({
    imports: [HttpModule],
    controllers: [TicketsController],
    providers: [TicketsServiceService],
})

export class TicketsModule {}