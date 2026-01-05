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
});
