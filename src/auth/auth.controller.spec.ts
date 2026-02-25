import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';
import { ForbiddenException, BadRequestException } from '@nestjs/common';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  const mockAuthService = {
    signUp: jest.fn(),
    signIn: jest.fn(),
    signOut: jest.fn(),
    refreshTokens: jest.fn(),
    googleLogin: jest.fn(),
    facebookLogin: jest.fn(),
    updateUser: jest.fn(),
    updateAvatar: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: ConfigService, useValue: {} },
      ],
    }).compile();

    controller = module.get(AuthController);
    authService = module.get(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should call signUp and return user', async () => {
      const dto = { email: 'test@mail.com', password: '123456' };
      authService.signUp.mockResolvedValue(dto as any);

      const result = await controller.signUp(dto as any);

      expect(authService.signUp).toHaveBeenCalledWith(dto);
      expect(result).toEqual(dto);
    });
  });

  describe('login', () => {
    it('should call signIn and return token payload', async () => {
      const dto = { email: 'test@mail.com', password: '123456' };
      const token = { accessToken: 'access', refreshToken: 'refresh' };

      authService.signIn.mockResolvedValue(token as any);

      const result = await controller.signIn(dto as any);

      expect(authService.signIn).toHaveBeenCalledWith(dto);
      expect(result).toEqual(token);
    });
  });

  describe('getMe', () => {
    it('should return req.user', () => {
      const req = { user: { id: 'user-id' } };
      expect(controller.getMe(req as any)).toEqual(req.user);
    });
  });

  describe('logout', () => {
    it('should call signOut with userId and accessToken', async () => {
      const req = {
        user: { id: 'user-id' },
        headers: { authorization: 'Bearer access-token' },
      };

      authService.signOut.mockResolvedValue({ success: true } as any);

      const result = await controller.logout(req as any);

      expect(authService.signOut).toHaveBeenCalledWith(
        'user-id',
        'access-token',
      );
      expect(result).toEqual({ success: true });
    });
  });

  describe('refresh', () => {
    it('should call refreshTokens', async () => {
      authService.refreshTokens.mockResolvedValue({ accessToken: 'new' } as any);

      const req = {
        headers: { authorization: 'Bearer old-token' },
      };

      const result = await controller.refresh(
        'user-id',
        'refresh-token',
        req as any,
      );

      expect(authService.refreshTokens).toHaveBeenCalledWith(
        'user-id',
        'refresh-token',
        'old-token',
      );
      expect(result).toEqual({ accessToken: 'new' });
    });
  });

  describe('google auth', () => {
    it('should call googleLogin', async () => {
      authService.googleLogin.mockResolvedValue({ token: 'google' } as any);

      const result = await controller.authenticate('code');

      expect(authService.googleLogin).toHaveBeenCalledWith('code');
      expect(result).toEqual({ token: 'google' });
    });
  });

  describe('facebook auth', () => {
    it('should call facebookLogin', async () => {
      authService.facebookLogin.mockResolvedValue({ token: 'fb' } as any);

      const result = await controller.facebookAuth('code');

      expect(authService.facebookLogin).toHaveBeenCalledWith('code');
      expect(result).toEqual({ token: 'fb' });
    });
  });

  describe('updateUser', () => {
    it('should throw ForbiddenException if user edits other profile', async () => {
      const req = { user: { id: 'user-1' } };

      await expect(
        controller.updateUser('user-2', {} as any, req as any),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should update user if same user', async () => {
      authService.updateUser.mockResolvedValue({ success: true } as any);

      const req = { user: { id: 'user-1' } };

      const result = await controller.updateUser(
        'user-1',
        { name: 'New Name' } as any,
        req as any,
      );

      expect(authService.updateUser).toHaveBeenCalledWith(
        'user-1',
        expect.any(Object),
      );
      expect(result).toEqual({ success: true });
    });
  });

  describe('uploadAvatar', () => {
    it('should throw if file is missing', async () => {
      const req = { user: { id: 'user-id' } };

      await expect(
        controller.uploadAvatar(req as any, null as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw if file is not image', async () => {
      const req = { user: { id: 'user-id' } };
      const file = { mimetype: 'application/pdf' };

      await expect(
        controller.uploadAvatar(req as any, file as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should upload avatar if file is valid', async () => {
      const req = { user: { id: 'user-id' } };
      const file = { mimetype: 'image/png' };

      authService.updateAvatar.mockResolvedValue({ avatar: 'url' } as any);

      const result = await controller.uploadAvatar(req as any, file as any);

      expect(authService.updateAvatar).toHaveBeenCalledWith('user-id', file);
      expect(result).toEqual({ avatar: 'url' });
    });
  });
});
