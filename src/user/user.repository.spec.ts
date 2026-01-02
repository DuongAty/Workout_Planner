import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './user.entity';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { ConflictException, HttpStatus, HttpException } from '@nestjs/common';
import {
  PASSWORD_INCORRECT_MESSAGE,
  USERNAME_NOT_FOUND_MESSAGE,
} from '../auth/auth-constants';
import { UsersRepository } from './user.repository';
jest.mock('bcrypt');
const mockUserRepository = () => ({
  findOneBy: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
});

// Mock JwtService
const mockJwtService = () => ({
  sign: jest.fn(),
});

describe('UsersRepository', () => {
  let repository: UsersRepository;
  let userRepository: jest.Mocked<Repository<User>>;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersRepository,
        { provide: getRepositoryToken(User), useFactory: mockUserRepository },
        { provide: JwtService, useFactory: mockJwtService },
      ],
    }).compile();
    repository = module.get<UsersRepository>(UsersRepository);
    userRepository = module.get(getRepositoryToken(User));
    jwtService = module.get(JwtService);
  });

  describe('createUser', () => {
    const authCredentialsDto = {
      username: 'testuser',
      password: 'password123',
    };

    it('The new user should be created successfully', async () => {
      userRepository.findOneBy.mockResolvedValue(null);
      userRepository.create.mockReturnValue({ ...authCredentialsDto });
      userRepository.save.mockResolvedValue(undefined);
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      await expect(
        repository.createUser(authCredentialsDto),
      ).resolves.not.toThrow();
      expect(userRepository.save).toHaveBeenCalled();
    });

    it('Should throw ConflictException if username already exists', async () => {
      userRepository.findOneBy.mockResolvedValue({
        id: 1,
        username: 'testuser',
      } as any);

      await expect(repository.createUser(authCredentialsDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('signIn', () => {
    const authCredentialsDto = {
      username: 'testuser',
      password: 'password123',
    };

    it('should return accessToken if logged in correctly', async () => {
      const mockUser = { username: 'testuser', password: 'hashedPassword' };
      userRepository.findOneBy.mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtService.sign.mockReturnValue('mockAccessToken');

      const result = await repository.signIn(authCredentialsDto);
      expect(result).toEqual({ accessToken: 'mockAccessToken' });
    });

    it('should throw Unauthorized if the user is not found', async () => {
      userRepository.findOneBy.mockResolvedValue(null);

      try {
        await repository.signIn(authCredentialsDto);
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect(error.getResponse().message).toBe(USERNAME_NOT_FOUND_MESSAGE);
        expect(error.getStatus()).toBe(HttpStatus.UNAUTHORIZED);
      }
    });

    it('Should throw Unauthorized if the password is wrong', async () => {
      userRepository.findOneBy.mockResolvedValue({
        password: 'hashedPassword',
      } as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      try {
        await repository.signIn(authCredentialsDto);
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect(error.getResponse().message).toBe(PASSWORD_INCORRECT_MESSAGE);
      }
    });
  });
});
