import { Injectable, UnauthorizedException } from '@nestjs/common';
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
import { JwtService } from '@nestjs/jwt';
import { RedisService } from 'src/redis/redis.service';
import * as bcrypt from 'bcrypt';
import {
  ACCESS_TOKEN_BLACKLIST_TTL,
  ACCESS_TOKEN_TTL,
  REFRESH_TOKEN_TTL,
} from 'src/common/constants/constants';
@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;
  constructor(
    private usersRepository: UsersRepository,
    private uploadService: UploadService,
    private configService: ConfigService,
    private jwtService: JwtService,
    private redisService: RedisService,
  ) {
    const redirectUri = `${this.configService.get('FRONTEND_URL')}/auth/google/callback`;
    this.googleClient = new OAuth2Client(
      this.configService.get('GOOGLE_CLIENT_ID'),
      this.configService.get('GOOGLE_CLIENT_SECRET'),
      redirectUri,
    );
  }

  private async generateAndSaveTokens(user: User): Promise<TokenPayload> {
    const payload = { sub: user.id, username: user.username };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, { expiresIn: ACCESS_TOKEN_TTL }),
      this.jwtService.signAsync(payload, { expiresIn: REFRESH_TOKEN_TTL }),
    ]);
    const salt = await bcrypt.genSalt();
    const hashedRefreshToken = await bcrypt.hash(refreshToken, salt);
    await this.usersRepository.updateRefreshToken(user.id, hashedRefreshToken);
    return { accessToken, refreshToken };
  }

  async getTokens(userId: string, username: string) {
    const payload = { sub: userId, username };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, { expiresIn: ACCESS_TOKEN_TTL }),
      this.jwtService.signAsync(payload, { expiresIn: REFRESH_TOKEN_TTL }),
    ]);
    return { accessToken, refreshToken };
  }

  async signUp(createUserDto: CreateUserDto): Promise<User> {
    return await this.usersRepository.createUser(createUserDto);
  }

  async signIn(authCredentialsDto: AuthCredentialsDto): Promise<TokenPayload> {
    const { username, password } = authCredentialsDto;
    const user = await this.usersRepository.findUserByUsername(username);
    if (user && (await bcrypt.compare(password, user.password))) {
      return await this.generateAndSaveTokens(user);
    }
    throw new UnauthorizedException('Invalid credentials');
  }

  async signOut(userId: string, accessToken: string): Promise<void> {
    await this.usersRepository.clearRefreshToken(userId);
    await this.redisService.blacklistToken(
      accessToken,
      ACCESS_TOKEN_BLACKLIST_TTL,
    );
  }

  async refreshTokens(
    userId: string,
    refreshToken: string,
    oldAccessToken: string,
  ) {
    const user = await this.usersRepository.findUser(userId);
    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('Access Denied');
    }
    const refreshTokenMatches = await bcrypt.compare(
      refreshToken,
      user.refreshToken,
    );
    if (!refreshTokenMatches) {
      await this.signOut(userId, oldAccessToken);
      throw new UnauthorizedException('Token detected as reused/invalid');
    }
    await this.redisService.blacklistToken(oldAccessToken, 900);
    const tokens = await this.getTokens(user.id, user.username);
    await this.usersRepository.updateRefreshToken(user.id, tokens.refreshToken);
    return tokens;
  }

  async googleLogin(code: string) {
    const FEUrl = this.configService.get('FRONTEND_URL');
    try {
      const { tokens } = await this.googleClient.getToken({
        code,
        redirect_uri: `${FEUrl}/auth/google/callback`,
      });
      this.googleClient.setCredentials(tokens);
      const userInfo = await this.googleClient.request({
        url: 'https://www.googleapis.com/oauth2/v3/userinfo',
      });
      const payload = userInfo.data as any;
      const user = await this.usersRepository.findOrCreateGoogleUser({
        email: payload.email,
        firstName: payload.given_name,
        lastName: payload.family_name,
        picture: payload.picture,
        provider: AuthProvider.GOOGLE,
        providerId: payload.sub,
      });
      return await this.generateAndSaveTokens(user);
    } catch (error) {
      throw new UnauthorizedException('Google Auth Failed: ' + error.message);
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
