import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { AuthServiceService } from './auth-service.service.js';
import { RegisterDto, LoginDto} from '@app/common';
import { Param } from '@nestjs/common';
import { Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Controller()
export class AuthServiceController {
  constructor(private readonly authServiceService: AuthServiceService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return await this.authServiceService.register(dto.email, dto.password, dto.name);
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return await this.authServiceService.login(dto.email, dto.password);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  getProfile(@Request() req: {user: {userId: string}}) {
    return this.authServiceService.getProfile(req.user.userId);
  }

}
