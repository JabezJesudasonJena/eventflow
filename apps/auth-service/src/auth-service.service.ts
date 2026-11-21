import { DatabaseService } from '@app/database/database.service.js';
import { KAFKA_SERVICE} from '@app/kafka';
import { Injectable } from '@nestjs/common';
import { OnModuleInit, Inject, ConflictException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { JwtService } from '@nestjs/jwt';
import { users } from '@app/database/schema/index.js';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';
import { KAFKA_TOPICS } from '@app/kafka/constants/kafka.constants.js';

@Injectable()
export class AuthServiceService implements OnModuleInit {
  constructor(
    @Inject(KAFKA_SERVICE) private readonly KafkaClient: ClientKafka,
    private readonly databaseService: DatabaseService,
    private readonly jwtService: JwtService
  ) {}

  async onModuleInit() {
    //  It connects to kafka when this module is initialized
    await this.KafkaClient.connect();
  }
  
  async register(email: string, password: string, name: string) {
    // check if the user already exists in the database
    const existingUser = await this.databaseService.db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if(existingUser.length > 0) {
      throw new ConflictException('User already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // create user
    const [user] = await this.databaseService.db
      .insert(users)
      .values({
        email,
        password: hashedPassword,
        name
      })
      .returning();
    
    // Send user registered event to kafka
    this.KafkaClient.emit(KAFKA_TOPICS.USER_REGISTERED, {
      userId: user.id,
      email: user.email,
      timestamp: new Date().toISOString()
    })
    
    return {message: 'User registered successfully', userId: user.id};
  }

  async login(email: string, password: string) {
    const [user] = await this.databaseService.db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);  

    if(!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('User not found');
    }
    const token = this.jwtService.sign({ sub: user.id, email: user.email });
    this.KafkaClient.emit(KAFKA_TOPICS.USER_LOGIN, {
      userId: user.id,
      timestamp: new Date().toISOString()
    })

    return {
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    };
  }

  async getProfile (userId: string) {
    const [user] = await this.databaseService.db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if(!user){
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    };
  }

}

