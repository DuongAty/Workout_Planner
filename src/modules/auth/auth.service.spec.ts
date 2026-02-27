import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersRepository } from '../user/user.repository';
import { UploadService } from '../common/upload/upload.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from '../redis/redis.service';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import axios from 'axios';

jest.mock('bcrypt');
jest.mock('axios');

const mockUsersRepository = {
  createUser: jest.fn(),
  findUserByUsername: jest.fn(),
  updateRefreshToken: jest.fn(),
  clearRefreshToken: jest.fn(),
  findUser: jest.fn(),
  findOrCreateSocialUser: jest.fn(),
  updateUser: jest.fn(),
  updateAvatar: jest.fn(),
};

const mockUploadService = {
  cleanupFile: jest.fn(),
  getFilePath: jest.fn(),
};

const mockConfigService = {
  get: jest.fn((key) => {
    const map = {
      FRONTEND_URL: 'http://localhost:3000',
      GOOGLE_CLIENT_ID: 'google-id',
      GOOGLE_CLIENT_SECRET: 'google-secret',
      FACEBOOK_APP_ID: 'fb-id',
      FACEBOOK_APP_SECRET: 'fb-secret',
    };
    return map[key];
  }),
};

const mockJwtService = {
  signAsync: jest.fn(),
};

const mockRedisService = {
  blacklistToken: jest.fn(),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersRepository, useValue: mockUsersRepository },
        { provide: UploadService, useValue: mockUploadService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: RedisService, useValue: mockRedisService },
      ],
    }).compile();

    service = module.get(AuthService);
    jest.clearAllMocks();
  });

  // ===== signUp =====
  it('signUp should create user', async () => {
    mockUsersRepository.createUser.mockResolvedValue({ id: '1' });
    const result = await service.signUp({ username: 'test' } as any);
    expect(result).toBeDefined();
  });

  // ===== signIn =====
  it('signIn success', async () => {
    mockUsersRepository.findUserByUsername.mockResolvedValue({
      id: '1',
      username: 'test',
      password: 'hashed',
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashedRefresh');
    mockJwtService.signAsync.mockResolvedValue('token');

    const result = await service.signIn({
      username: 'test',
      password: '123',
    });

    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();
  });

  it('signIn user not found', async () => {
    mockUsersRepository.findUserByUsername.mockResolvedValue(null);

    await expect(
      service.signIn({ username: 'x', password: 'x' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('signIn wrong password', async () => {
    mockUsersRepository.findUserByUsername.mockResolvedValue({
      password: 'hashed',
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(
      service.signIn({ username: 'x', password: 'x' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  // ===== signOut =====
  it('signOut should blacklist token', async () => {
    await service.signOut('1', 'access-token');
    expect(mockUsersRepository.clearRefreshToken).toHaveBeenCalled();
    expect(mockRedisService.blacklistToken).toHaveBeenCalled();
  });

  // ===== refreshTokens =====
  it('refreshTokens success', async () => {
    mockUsersRepository.findUser.mockResolvedValue({
      id: '1',
      username: 'test',
      refreshToken: 'hashed',
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    mockJwtService.signAsync.mockResolvedValue('new-token');

    const result = await service.refreshTokens('1', 'refresh', 'old-access');
    expect(result.accessToken).toBeDefined();
  });

  it('refreshTokens invalid refresh token', async () => {
    mockUsersRepository.findUser.mockResolvedValue({
      id: '1',
      refreshToken: 'hashed',
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(service.refreshTokens('1', 'x', 'old')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  // ===== googleLogin =====
  it('googleLogin success', async () => {
    mockUsersRepository.findOrCreateSocialUser.mockResolvedValue({
      id: '1',
      username: 'google',
    });
    (service as any).googleClient = {
      getToken: jest.fn().mockResolvedValue({ tokens: {} }),
      setCredentials: jest.fn(),
      request: jest.fn().mockResolvedValue({
        data: {
          email: 'a@gmail.com',
          given_name: 'A',
          family_name: 'B',
          picture: 'img',
          sub: '123',
        },
      }),
    };
    mockJwtService.signAsync.mockResolvedValue('token');
    (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');

    const result = await service.googleLogin('code');
    expect(result.accessToken).toBeDefined();
  });

  // ===== facebookLogin =====
  it('facebookLogin success', async () => {
    (axios.get as jest.Mock)
      .mockResolvedValueOnce({ data: { access_token: 'fb-token' } })
      .mockResolvedValueOnce({
        data: {
          id: '1',
          first_name: 'A',
          last_name: 'B',
          picture: { data: { url: 'img' } },
        },
      });

    mockUsersRepository.findOrCreateSocialUser.mockResolvedValue({
      id: '1',
      username: 'fb',
    });

    mockJwtService.signAsync.mockResolvedValue('token');
    (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');

    const result = await service.facebookLogin('code');
    expect(result.accessToken).toBeDefined();
  });

  // ===== updateUser =====
  it('updateUser success', async () => {
    mockUsersRepository.updateUser.mockResolvedValue({});
    const result = await service.updateUser('1', {} as any);
    expect(result).toBeDefined();
  });

  // ===== updateAvatar =====
  it('updateAvatar cleanup old avatar', async () => {
    mockUsersRepository.findUser.mockResolvedValue({ avatar: 'old.png' });
    mockUploadService.getFilePath.mockReturnValue('new.png');

    const result = await service.updateAvatar('1', {} as any);
    expect(mockUploadService.cleanupFile).toHaveBeenCalled();
    expect(result.avatar).toBe('new.png');
  });
});
