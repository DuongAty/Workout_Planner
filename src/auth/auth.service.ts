import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import { UsersRepository } from '../user/user.repository';
import { TokenPayload } from './type/accessToken.type';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from 'src/user/user.entity';
import { UpdateUserProfileDto } from './dto/user.profile.dto';
import { UploadService } from 'src/common/upload/upload.service';
import { AuthProvider } from 'src/common/enum/user-enum';
import { OAuth2Client } from 'google-auth-library';
import { ConfigService } from '@nestjs/config';
@Injectable()
export class AuthService {
  private client: OAuth2Client;
  constructor(
    private usersRepository: UsersRepository,
    private uploadService: UploadService,
    private configService: ConfigService,
  ) {
    this.client = new OAuth2Client(
      this.configService.get<string>('GOOGLE_CLIENT_ID'),
      this.configService.get<string>('GOOGLE_CLIENT_SECRET'),
      this.configService.get<string>('GOOGLE_CALLBACK_URL'),
    );
  }

  async signUp(createUserDto: CreateUserDto): Promise<User> {
    return await this.usersRepository.createUser(createUserDto);
  }

  async signIn(authCredentialsDto: AuthCredentialsDto): Promise<TokenPayload> {
    return await this.usersRepository.signIn(authCredentialsDto);
  }
  async refreshTokens(
    userId: string,
    refreshToken: string,
    oldAccessToken: string,
  ): Promise<TokenPayload> {
    return await this.usersRepository.refreshTokens(
      userId,
      refreshToken,
      oldAccessToken,
    );
  }

  async signOut(userId: string, accessToken: string): Promise<void> {
    await this.usersRepository.logout(userId, accessToken);
  }

  async verifyGoogleCode(code: string, codeVerifier?: string) {
    if (!code) throw new BadRequestException('Missing Google code');
    try {
      const getTokenArgs: any = codeVerifier ? { code, codeVerifier } : code;
      const r = await this.client.getToken(getTokenArgs);
      const tokens = r.tokens;
      this.client.setCredentials(tokens);
      const ticket = await this.client.verifyIdToken({
        idToken: tokens.id_token!,
        audience: this.configService.get<string>('GOOGLE_CLIENT_ID'),
      });
      const payload = ticket.getPayload();
      if (!payload)
        throw new UnauthorizedException('Invalid Google token payload');
      return {
        email: payload.email,
        firstName: payload.given_name,
        lastName: payload.family_name,
        picture: payload.picture,
        provider: 'google',
        providerId: payload.sub,
        tokens,
      };
    } catch (err: any) {
      console.error('Google token exchange error:', {
        message: err.message,
        code: err.code,
        response: err.response?.data,
      });
      if (err.response?.data?.error === 'invalid_grant') {
        throw new UnauthorizedException(
          'Google code invalid or expired (invalid_grant)',
        );
      }
      throw new InternalServerErrorException('Failed to verify Google code');
    }
  }

  async googleLogin(googleUser: any) {
    return await this.usersRepository.findOrCreateGoogleUser(googleUser);
  }

  async extractUserInfoFromCode(code: string, provider: AuthProvider) {
    if (provider !== AuthProvider.GOOGLE) {
      throw new BadRequestException('Provider không hỗ trợ');
    }
    const googleUser = await this.verifyGoogleCode(code);
    return {
      email: googleUser.email,
      username: googleUser.email?.split('@')[0],
      userId: googleUser.providerId,
      provider: googleUser.provider,
    };
  }

  async loginBy(provider: AuthProvider, code: string) {
    switch (provider) {
      case AuthProvider.GOOGLE: {
        const googleUser = await this.verifyGoogleCode(code);
        return await this.googleLogin(googleUser);
      }
      default:
        throw new UnauthorizedException('Provider không được hỗ trợ');
    }
  }

  async updateUser(userId: string, updateUserDto: UpdateUserProfileDto) {
    return await this.usersRepository.updateUser(userId, updateUserDto);
  }

  async updateAvatar(userId: string, file: Express.Multer.File) {
    const user = await this.usersRepository.findUser(userId);
    if (user && user.avatar) {
      this.uploadService.cleanupFile(user.avatar);
    }
    const newAvatarPath = this.uploadService.getFilePath(file);
    await this.usersRepository.updateAvatar(userId, newAvatarPath);
    return { avatar: newAvatarPath };
  }
}
