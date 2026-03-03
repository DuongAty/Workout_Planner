import { Test, TestingModule } from '@nestjs/testing';
import { UsersRepository } from './user.repository';
import { Repository, Not } from 'typeorm';
import {
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { AuthProvider } from '../common/enum/user-enum';
import { User } from './user.entity';

jest.mock('bcrypt');

describe('UsersRepository', () => {
  let usersRepository: UsersRepository;
  let repo: jest.Mocked<Repository<User>>;

  const mockRepo = {
    findOneBy: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersRepository,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepo,
        },
      ],
    }).compile();

    usersRepository = module.get(UsersRepository);
    repo = module.get(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    it('should create user successfully', async () => {
      repo.findOneBy.mockResolvedValue(null);
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');

      const user = { id: '1' } as User;
      repo.create.mockReturnValue(user);
      repo.save.mockResolvedValue(user);

      const result = await usersRepository.createUser({
        fullname: 'Test',
        username: 'test',
        password: '123',
      } as any);

      expect(repo.save).toHaveBeenCalled();
      expect(result).toEqual(user);
    });

    it('should throw ConflictException if username exists', async () => {
      repo.findOneBy.mockResolvedValue({ id: '1' } as User);

      await expect(
        usersRepository.createUser({
          fullname: 'Test',
          username: 'test',
          password: '123',
        } as any),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw InternalServerErrorException if save fails', async () => {
      repo.findOneBy.mockResolvedValue(null);
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
      repo.create.mockReturnValue({} as User);
      repo.save.mockRejectedValue(new Error());

      await expect(
        usersRepository.createUser({
          fullname: 'Test',
          username: 'test',
          password: '123',
        } as any),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('updateRefreshToken', () => {
    it('should update refresh token', async () => {
      await usersRepository.updateRefreshToken('id', 'token');
      expect(repo.update).toHaveBeenCalledWith('id', {
        refreshToken: 'token',
      });
    });
  });

  describe('clearRefreshToken', () => {
    it('should clear refresh token', async () => {
      await usersRepository.clearRefreshToken('id');
      expect(repo.update).toHaveBeenCalledWith('id', {
        refreshToken: null,
      });
    });
  });

  describe('findOrCreateSocialUser', () => {
    const socialUser = {
      email: 'a@mail.com',
      firstName: 'A',
      lastName: 'B',
      picture: 'img',
      provider: AuthProvider.GOOGLE,
      providerId: '123456',
    };

    it('should return existing user', async () => {
      const user = { id: '1' } as User;
      repo.findOneBy.mockResolvedValue(user);

      const result = await usersRepository.findOrCreateSocialUser(socialUser);

      expect(result).toEqual(user);
    });

    it('should create new user if not exists', async () => {
      repo.findOneBy.mockResolvedValue(null);
      const created = { id: '1' } as User;
      repo.create.mockReturnValue(created);
      repo.save.mockResolvedValue(created);

      const result = await usersRepository.findOrCreateSocialUser(socialUser);

      expect(repo.create).toHaveBeenCalled();
      expect(repo.save).toHaveBeenCalled();
      expect(result).toEqual(created);
    });
  });

  describe('findUserByUsername', () => {
    it('should return user', async () => {
      const user = { id: '1' } as User;
      repo.findOneBy.mockResolvedValue(user);

      const result = await usersRepository.findUserByUsername('test');

      expect(result).toEqual(user);
    });
  });

  describe('findUser', () => {
    it('should return user', async () => {
      const user = { id: '1' } as User;
      repo.findOneBy.mockResolvedValue(user);

      const result = await usersRepository.findUser('1');

      expect(result).toEqual(user);
    });

    it('should throw NotFoundException if error occurs', async () => {
      repo.findOneBy.mockRejectedValue(new Error());

      await expect(usersRepository.findUser('1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateUser', () => {
    it('should throw NotFoundException if user not exists', async () => {
      jest.spyOn(usersRepository, 'findUser').mockResolvedValue(null as any);

      await expect(usersRepository.updateUser('1', {})).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException if email is duplicated', async () => {
      jest
        .spyOn(usersRepository, 'findUser')
        .mockResolvedValue({ id: '1' } as User);
      repo.findOne.mockResolvedValue({ id: '2' } as User);

      await expect(
        usersRepository.updateUser('1', { email: 'a@mail.com' } as any),
      ).rejects.toThrow(ConflictException);
    });

    it('should update user successfully', async () => {
      const user = { id: '1' } as User;
      jest.spyOn(usersRepository, 'findUser').mockResolvedValue(user);
      repo.findOne.mockResolvedValue(null);
      repo.findOneBy.mockResolvedValue(user);

      const result = await usersRepository.updateUser('1', {
        fullname: 'New',
      });

      expect(repo.update).toHaveBeenCalledWith('1', { fullname: 'New' });
      expect(result).toEqual(user);
    });
  });

  describe('updateAvatar', () => {
    it('should call updateUser with avatar', async () => {
      const spy = jest
        .spyOn(usersRepository, 'updateUser')
        .mockResolvedValue({ avatar: 'img' } as any);

      const result = await usersRepository.updateAvatar('1', 'img');

      expect(spy).toHaveBeenCalledWith('1', { avatar: 'img' });
      expect(result).toEqual({ avatar: 'img' });
    });
  });
});
