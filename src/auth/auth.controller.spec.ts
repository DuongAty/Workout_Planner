import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import { PassportModule } from '@nestjs/passport';

describe('AuthController', () => {
  let controller: AuthController;
  const mockAuthService = {
    signUp: jest.fn(),
    signIn: jest.fn(),
  };
  const mockCredentialsDto: AuthCredentialsDto = {
    username: 'testuser',
    password: 'Password123!',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();
    controller = module.get<AuthController>(AuthController);
  });

  describe('signUp', () => {
    it('You should call authService.signUp and return the result.', async () => {
      mockAuthService.signUp.mockResolvedValue(undefined);
      const result = await controller.signUp(mockCredentialsDto);
      expect(mockAuthService.signUp).toHaveBeenCalledWith(mockCredentialsDto);
      expect(result).toBeUndefined();
    });
  });

  describe('signIn', () => {
    it('Therefore, call authService.signIn and return AccessTokenPayload.', async () => {
      const mockResult = { accessToken: 'mock_token' };
      mockAuthService.signIn.mockResolvedValue(mockResult);
      const result = await controller.signIn(mockCredentialsDto);
      expect(mockAuthService.signIn).toHaveBeenCalledWith(mockCredentialsDto);
      expect(result).toEqual(mockResult);
    });
  });
  describe('getMe', () => {
    it('It should return the full name and username of the current user.', () => {
      const mockUser = {
        fullname: 'Duong Van A',
        username: 'duongva',
        password: 'hashed_password',
        id: 'user-uuid',
      };
      const mockRequest = {
        user: mockUser,
      };
      const result = controller.getMe(mockRequest as any);
      expect(result).toEqual({
        fullname: mockUser.fullname,
        username: mockUser.username,
      });
      expect(result).not.toHaveProperty('password');
      expect(result).not.toHaveProperty('id');
    });
  });
});
