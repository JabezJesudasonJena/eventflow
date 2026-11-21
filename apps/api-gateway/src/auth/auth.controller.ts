import { Controller, Post, Body, Get, Headers } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { LoginDto, RegisterDto } from '@app/common/dto/index.js';
import { Query } from 'pg';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}
    
    @Post('register')
    async register(@Body() dto: RegisterDto) {
        return await this.authService.register(dto);
    }


    @Post('login')
    async login(@Body() dto: LoginDto) {
        return await this.authService.login(dto);
    }

    @Get('profile')
    async getProfile(@Headers('Authorization') token: string) {
        return await this.authService.getProfile(token);
    }
}