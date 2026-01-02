import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import { UnauthorizedException } from '@nestjs/common';
import { UsersRepository } from '../user/user.repository';

const mockUsersRepository = {
  createUser: jest.fn().mockReturnValue(''),
  signIn: jest.fn().mockReturnValue(''),
};

describe('AuthService', () => {
  let authService: AuthService;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersRepository, useValue: mockUsersRepository },
      ],
    }).compile();
    authService = module.get<AuthService>(AuthService);
  });

  describe('signUp', () => {
    it('You should call usersRepository.createUser and return the result.', async () => {
      const authCredentialsDto: AuthCredentialsDto = {
        username: 'testuser',
        password: 'password123',
      };
      mockUsersRepository.createUser.mockResolvedValue(authCredentialsDto);
      const result = await authService.signUp(authCredentialsDto);
      expect(mockUsersRepository.createUser).toHaveBeenCalledWith(
        authCredentialsDto,
      );
      expect(result).toBe(authCredentialsDto);
    });
  });

  describe('signIn', () => {
    it('It should return the Access Token Payload upon successful login.', async () => {
      const authCredentialsDto: AuthCredentialsDto = {
        username: 'testuser',
        password: 'password123',
      };
      const mockPayload = { accessToken: 'mockToken' };
      mockUsersRepository.signIn.mockResolvedValue(mockPayload);
      const result = await authService.signIn(authCredentialsDto);
      expect(mockUsersRepository.signIn).toHaveBeenCalledWith(
        authCredentialsDto,
      );
      expect(result).toEqual(mockPayload);
    });

    it('You should throw an error if userRepository.signIn reports an error.', async () => {
      mockUsersRepository.signIn.mockRejectedValue(
        new UnauthorizedException('Invalid credentials'),
      );
      await expect(
        authService.signIn({ username: 'wrong', password: 'password' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
