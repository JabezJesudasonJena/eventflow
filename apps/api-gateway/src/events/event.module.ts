import {Module} from '@nestjs/common';
import { EventsService } from './events.service.js';
import { EventsController } from './events.controller.js';
import {HttpModule} from '@nestjs/axios';

@Module({
    imports: [HttpModule],
    controllers: [EventsController],
    providers: [EventsService],
})
export class EventModule {}