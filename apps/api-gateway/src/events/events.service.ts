import {Injectable} from '@nestjs/common';
import { EventResponse, SERVICE_PORTS, CreateEventDto, UpdateEventDto } from '@app/common';
import { HttpService } from '@nestjs/axios';
import { HttpException } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class EventsService {
    private readonly eventsServiceUrl = `http://localhost:${SERVICE_PORTS.EVENTS_SERVICE}`;

    constructor(
        private readonly httpService: HttpService
    ) {}

    async create(data: CreateEventDto, userId: string, userRole: string) : Promise<EventResponse> {
        try { 
            const res = await firstValueFrom(
                this.httpService.post<EventResponse>(`${this.eventsServiceUrl}`, data, {
                    headers: { 'x-user-id': userId, 'x-user-role': userRole },
                })
            );
            return res.data;
        } catch (error: any) {
            this.handleError(error);
        }
    }

    async findAll(): Promise<EventResponse[]> {
        try {
            const res = await firstValueFrom(
                this.httpService.get<EventResponse[]>(`${this.eventsServiceUrl}`)
            );
            return res.data;
        } catch (error: any) {
            this.handleError(error);
        }
    }

    async findOne(id: string) : Promise<EventResponse> {
        try {
            const res = await firstValueFrom(
                this.httpService.get<EventResponse>(`${this.eventsServiceUrl}/${id}`)
            );
            return res.data;
        } catch (error: any) {
            this.handleError(error);
        }
    }

    async findMyEvents(userId: string) : Promise<EventResponse[]> {
        try {
            const res = await firstValueFrom(
                this.httpService.get<EventResponse[]>(`${this.eventsServiceUrl}/my-events`, {
                    headers: { 'x-user-id': userId}
                })
            );
            return res.data;
        } catch(error: any) {
            this.handleError(error);
        }
    }

    async update(id: string, data: UpdateEventDto, userId: string, userRole: string) : Promise<EventResponse> {
        try {
            const res = await firstValueFrom(
                this.httpService.put<EventResponse>(`${this.eventsServiceUrl}/${id}`, data, {
                    headers: { 'x-user-id': userId, 'x-user-role': userRole },
                })
            );
            return res.data;
        } catch (error: any) {
            this.handleError(error);
        }
    }

    async publish(id: string, userId: string, userRole: string) : Promise<EventResponse> {
        try { 
            const res = await firstValueFrom(
                this.httpService.post<EventResponse>(`${this.eventsServiceUrl}/${id}/publish`, {}, {
                    headers: { 'x-user-id': userId, 'x-user-role': userRole },
                })
            );
            return res.data;
        } catch (error: any) {
            this.handleError(error);
        }
    }

    async cancel(id: string, userId: string, userRole: string) {
        try {
            const res = await firstValueFrom(
                this.httpService.post(`${this.eventsServiceUrl}/${id}/cancel`, {}, {
                    headers: { 'x-user-id': userId, 'x-user-role': userRole },
                })
            );
            return res.data;
        } catch (error: any) {
            this.handleError(error);
        }
    }

    private handleError(error: unknown) : never{
        const err = error as {
            response?: { data: string | object; status: number };
        }
        if(err.response) {
            throw new HttpException(err.response.data, err.response.status);
        } else {
            throw new HttpException('Internal server error', 500);
        }
    }
}