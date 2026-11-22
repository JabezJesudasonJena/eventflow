import {Injectable, HttpException} from '@nestjs/common';
import {firstValueFrom} from 'rxjs';
import {HttpService} from '@nestjs/axios';
import { SERVICE_PORTS } from '@app/common/constants/index.js';

@Injectable()
export class TicketsServiceService {
    private readonly ticketServiceUrl = `http://localhost:${SERVICE_PORTS.TICKETS_SERVICE}`
    constructor(
        private readonly httpService: HttpService
    ) {}

    async purchaseTicket(purchaseData: object, userId: string) {
        try {
            const res = await firstValueFrom(
                this.httpService.post(`${this.ticketServiceUrl}/purchase`, purchaseData, {
                    headers: {
                        'x-user-id': userId
                    }
                })
            );
            return res.data;
        }
        catch (error) {
            this.handleError(error);
        }
    }

    async myTickets(userId: string) {
        try {
            const res = await firstValueFrom(
                this.httpService.get(`${this.ticketServiceUrl}/mytickets`, {
                    headers: {
                        'x-user-id': userId
                    }
                })
            );
            return res.data;
        }
        catch (error) {
            this.handleError(error);
        }
    }

    async findOne(userId: string, ticketCode: string) {
        try{
            const res = await firstValueFrom(
                this.httpService.get(`${this.ticketServiceUrl}/${ticketCode}`, {
                    headers: {
                        'x-user-id': userId
                    }
                })
            );
            return res.data;
        }
        catch (error) {
            this.handleError(error);
        }
    }

    async cancelTicket(userId: string, ticketCode: string) {
        try{
            const res = await firstValueFrom(
                this.httpService.post(`${this.ticketServiceUrl}/cancel/${ticketCode}`, {}, {
                    headers: {
                        'x-user-id': userId
                    }
                })
            );
            return res.data;
        }
        catch (error) {
            this.handleError(error);
        }
    }

    async checkInTicket(organizerId: string, ticketCode: string) {
        try{
            const res = await firstValueFrom(
                this.httpService.post(`${this.ticketServiceUrl}/checkin/${ticketCode}`, {}, {
                    headers: {
                        'x-user-id': organizerId
                    }
                })
            );
            return res.data;
        }
        catch (error) {
            this.handleError(error);
        }
    }

    async findEventTickets(organizerId: string, eventId: string) {
        try{
            const res = await firstValueFrom(
                this.httpService.get(`${this.ticketServiceUrl}/event/${eventId}`, {
                    headers: {
                        'x-user-id': organizerId
                    }
                })
            );
            return res.data;
        }
        catch (error) {
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