import { Test, TestingModule } from '@nestjs/testing';
import { AuthServiceService } from './auth-service.service.js';
import { JwtService } from '@nestjs/jwt';
import { DatabaseService } from '@app/database/database.service.js';
import { KAFKA_SERVICE } from '@app/kafka';
import { KAFKA_TOPICS } from '@app/kafka/constants/kafka.constants.js';
import { ConflictException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import * as bcrypt from 'bcrypt';

vi.mock('bcrypt', () => ({
  hash: vi.fn(),
  compare: vi.fn(),
}));

describe('AuthServiceService', () => {
  let service: AuthServiceService;
  let mockKafkaClient: {
    connect: Mock;
    emit: Mock;
  };
  let mockDb: {
    select: Mock;
    insert: Mock;
    from: Mock;
    where: Mock;
    limit: Mock;
    values: Mock;
    returning: Mock;
  };
  let mockJwtService: {
    sign: Mock;
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    mockKafkaClient = {
      connect: vi.fn().mockResolvedValue(undefined),
      emit: vi.fn(),
    };

    mockDb = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn(),
      values: vi.fn().mockReturnThis(),
      returning: vi.fn(),
    };

    mockJwtService = {
      sign: vi.fn().mockReturnValue('mock-jwt-token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthServiceService,
        { provide: KAFKA_SERVICE, useValue: mockKafkaClient },
        { provide: DatabaseService, useValue: { db: mockDb } },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthServiceService>(AuthServiceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should connect to Kafka on module initialization', async () => {
      await service.onModuleInit();
      expect(mockKafkaClient.connect).toHaveBeenCalledTimes(1);
    });
  });

  describe('register', () => {
    it('should successfully register a new user, emit Kafka event, and return result', async () => {
      mockDb.limit.mockResolvedValueOnce([]); // no existing user
      const createdUser = {
        id: 'new-user-id',
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashedPassword',
      };
      mockDb.returning.mockResolvedValueOnce([createdUser]);
      vi.mocked(bcrypt.hash).mockResolvedValueOnce('hashedPassword' as never);

      const result = await service.register('test@example.com', 'password123', 'Test User');

      expect(mockDb.select).toHaveBeenCalled();
      expect(mockDb.limit).toHaveBeenCalledWith(1);
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(mockDb.insert).toHaveBeenCalled();
      expect(mockDb.values).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'hashedPassword',
        name: 'Test User',
      });
      expect(mockKafkaClient.emit).toHaveBeenCalledWith(
        KAFKA_TOPICS.USER_REGISTERED,
        expect.objectContaining({
          userId: 'new-user-id',
          email: 'test@example.com',
          name: 'Test User',
          timestamp: expect.any(String),
        }),
      );
      expect(result).toEqual({
        message: 'User registered successfully',
        userId: 'new-user-id',
      });
    });

    it('should throw ConflictException if user already exists', async () => {
      mockDb.limit.mockResolvedValueOnce([{ id: 'existing-id', email: 'test@example.com' }]);

      await expect(
        service.register('test@example.com', 'password123', 'Test User'),
      ).rejects.toThrow(ConflictException);

      expect(mockDb.insert).not.toHaveBeenCalled();
      expect(mockKafkaClient.emit).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const mockUser = {
      id: 'user-id',
      email: 'test@example.com',
      password: 'hashedPassword',
      name: 'Test User',
      role: 'user',
    };

    it('should login successfully, sign token, emit Kafka event, and return token and user', async () => {
      mockDb.limit.mockResolvedValueOnce([mockUser]);
      vi.mocked(bcrypt.compare).mockResolvedValueOnce(true as never);

      const result = await service.login('test@example.com', 'password123');

      expect(bcrypt.compare).toHaveBeenCalledWith('password123', mockUser.password);
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
      });
      expect(mockKafkaClient.emit).toHaveBeenCalledWith(
        KAFKA_TOPICS.USER_LOGIN,
        expect.objectContaining({
          userId: mockUser.id,
          timestamp: expect.any(String),
        }),
      );
      expect(result).toEqual({
        access_token: 'mock-jwt-token',
        user: {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
          role: mockUser.role,
        },
      });
    });

    it('should throw UnauthorizedException if user does not exist', async () => {
      mockDb.limit.mockResolvedValueOnce([]);

      await expect(service.login('notfound@example.com', 'password123')).rejects.toThrow(
        UnauthorizedException,
      );

      expect(mockJwtService.sign).not.toHaveBeenCalled();
      expect(mockKafkaClient.emit).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if password does not match', async () => {
      mockDb.limit.mockResolvedValueOnce([mockUser]);
      vi.mocked(bcrypt.compare).mockResolvedValueOnce(false as never);

      await expect(service.login('test@example.com', 'wrongpassword')).rejects.toThrow(
        UnauthorizedException,
      );

      expect(mockJwtService.sign).not.toHaveBeenCalled();
      expect(mockKafkaClient.emit).not.toHaveBeenCalled();
    });
  });

  describe('getProfile', () => {
    it('should return user profile if user is found', async () => {
      const mockUserProfile = {
        id: 'user-id',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
      };
      mockDb.limit.mockResolvedValueOnce([mockUserProfile]);

      const result = await service.getProfile('user-id');

      expect(result).toEqual(mockUserProfile);
    });

    it('should throw NotFoundException if user is not found', async () => {
      mockDb.limit.mockResolvedValueOnce([]);

      await expect(service.getProfile('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });
});