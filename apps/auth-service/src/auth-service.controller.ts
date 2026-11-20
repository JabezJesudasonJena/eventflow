import { Controller, Get, Post, Body } from '@nestjs/common';
import { AuthServiceService } from './auth-service.service.js';

@Controller()
export class AuthServiceController {
  constructor(private readonly authServiceService: AuthServiceService) {}

  @Get()
  getHello(): string {
    return this.authServiceService.getHello();
  }

  @Post('register')
  async register(@Body() body : { email: string }) {
    return await this.authServiceService.stimulateUserRegistration(body.email);
  }
}
