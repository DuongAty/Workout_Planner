import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import { UsersRepository } from '../user/user.repository';
import { TokenPayload } from './type/accessToken.type';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from '../user/user.entity';
import { UpdateUserProfileDto } from './dto/user.profile.dto';
import { UploadService } from '../common/upload/upload.service';
import { AuthProvider } from '../common/enum/user-enum';
import { OAuth2Client } from 'google-auth-library';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from '../redis/redis.service';
import * as bcrypt from 'bcrypt';
import {
  ACCESS_TOKEN_BLACKLIST_TTL,
  ACCESS_TOKEN_TTL,
  REFRESH_TOKEN_TTL,
} from '../common/constants/constants';
import axios from 'axios';
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
    if (!user) {
      throw new UnauthorizedException('Tài khoản không tồn tại');
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Mật khẩu không chính xác');
    }
    if (user && isMatch) {
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
      const user = await this.usersRepository.findOrCreateSocialUser({
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

  async facebookLogin(code: string) {
    try {
      const appId = this.configService.get('FACEBOOK_APP_ID');
      const appSecret = this.configService.get('FACEBOOK_APP_SECRET');
      const redirectUri = `${this.configService.get('FRONTEND_URL')}/auth/facebook/callback`;
      const tokenResponse = await axios.get(
        `https://graph.facebook.com/v18.0/oauth/access_token`,
        {
          params: {
            client_id: appId,
            client_secret: appSecret,
            redirect_uri: redirectUri,
            code: code,
          },
        },
      );
      const fbAccessToken = tokenResponse.data.access_token;
      const userResponse = await axios.get(`https://graph.facebook.com/me`, {
        params: {
          fields: 'id,name,email,first_name,last_name,picture.type(large)',
          access_token: fbAccessToken,
        },
      });
      const fbUser = userResponse.data;
      const socialData = {
        email: fbUser.email || `${fbUser.id}@facebook.user`,
        firstName: fbUser.first_name,
        lastName: fbUser.last_name,
        picture: fbUser.picture?.data?.url,
        provider: AuthProvider.FACEBOOK,
        providerId: fbUser.id,
      };
      const user =
        await this.usersRepository.findOrCreateSocialUser(socialData);
      return await this.generateAndSaveTokens(user);
    } catch (error) {
      console.error(
        'Facebook API Error:',
        error.response?.data || error.message,
      );
      throw new UnauthorizedException('Facebook Auth Failed: ' + error.message);
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
