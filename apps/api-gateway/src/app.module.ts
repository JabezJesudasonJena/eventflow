import { Module } from '@nestjs/common';
import { createObserveModule } from '@nestjs/observe';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { EventModule } from './events/event.module.js';
import {PassportModule} from '@nestjs/passport';
import {JwtModule} from '@nestjs/jwt';
import { JwtStrategy } from './jwt.startegy.js';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'secret',
    }),
    AuthModule,
    EventModule
  ],
  controllers: [AppController],
  // It is required to provide the JwtStrategy here because it is used in the AuthGuard which is used in the AppController
  providers: [AppService,JwtStrategy],
})
export class AppModule {}
