import { Injectable, HttpException } from '@nestjs/common';
import {HttpService} from '@nestjs/axios';
import {firstValueFrom} from 'rxjs';
import {SERVICE_PORTS} from '@app/common/constants/index.js';
import {AuthResponse, UserProfileResponse} from '@app/common/interfaces/index.js';

@Injectable()
export class AuthService {
    private readonly authServiceUrl: string = `http://localhost:${SERVICE_PORTS.AUTH_SERVICE}`;

    constructor(private readonly httpService: HttpService) {}

    async register(data: {email: string, password: string, name: string}) : Promise<UserProfileResponse> {
        try { 
            const res = await firstValueFrom(
                this.httpService.post<UserProfileResponse>(
                    `${this.authServiceUrl}/register`, 
                    data
                )
            );
            return res.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    async login(data: {email: string, password: string}) : Promise<AuthResponse> {
        try { 
            const res = await firstValueFrom(
                this.httpService.post<AuthResponse>(
                    `${this.authServiceUrl}/login`, 
                    data
                )
            );
            return res.data;
        } catch (error) {
            this.handleError(error);
        }
    }

    async getProfile(token: string) {
        try {
            const res = await firstValueFrom(
                this.httpService.get(`${this.authServiceUrl}/profile`, {
                    headers: { Authorization: token,},
                })
            )
            return res.data;
        } catch (error) {
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
