import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import { UsersRepository } from '../user/user.repository';
import { TokenPayload } from './type/accessToken.type';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from '../user/user.entity';
import { UpdateTokenDto, UpdateUserProfileDto } from './dto/user.profile.dto';
import { UploadService } from '../../upload/upload.service';
import { AuthProvider } from './../../enums/user-enum';
import { OAuth2Client } from 'google-auth-library';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from './../../redis/redis.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import {
  ACCESS_TOKEN_BLACKLIST_TTL,
  ACCESS_TOKEN_TTL,
  REFRESH_TOKEN_TTL,
} from '../../constants/constants';
import axios from 'axios';
import { GoogleUserInfo } from 'src/interfaces/interface';
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto/change-password.dto';
import { MailerService } from '@nestjs-modules/mailer';
@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;
  constructor(
    private usersRepository: UsersRepository,
    private uploadService: UploadService,
    private configService: ConfigService,
    private jwtService: JwtService,
    private redisService: RedisService,
    private mailService: MailerService,
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
      throw new UnauthorizedException('The account does not exist.');
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Incorrect password');
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

  async updateToken(userId: string, dto: UpdateTokenDto) {
    return this.usersRepository.updateToken(userId, dto);
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
      const payload = userInfo.data as GoogleUserInfo;
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

  private async verifyCurrentPassword(current: string, hash: string) {
    if (!current)
      throw new BadRequestException('Vui lòng nhập mật khẩu hiện tại');
    const isMatch = await bcrypt.compare(current, hash);
    if (!isMatch)
      throw new BadRequestException('Mật khẩu hiện tại không chính xác');
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.usersRepository.findUser(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.provider === 'google' || user.provider === 'facebook') {
      if (user.password) {
        await this.verifyCurrentPassword(dto.currentPassword, user.password);
      }
    } else {
      await this.verifyCurrentPassword(dto.currentPassword, user.password);
    }
    const salt = await bcrypt.genSalt();
    const newPassword = await bcrypt.hash(dto.newPassword, salt);
    return this.usersRepository.updatePassword(userId, newPassword);
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.usersRepository.findUserByEmail(dto.email);
    if (!user) throw new NotFoundException('Email không tồn tại');
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 phút
    await this.usersRepository.saveResetToken(user.id, token, expiresAt);
    const resetLink = `http://localhost:5173/reset-password?token=${token}`;
    await this.mailService.sendMail({
      to: user.email,
      subject: 'Đặt lại mật khẩu',
      text: `Click vào đây: ${resetLink}`,
    });

    return { message: 'Link reset đã được gửi' };
  }
  async resetPassword(dto: ResetPasswordDto) {
    const tokenData = await this.usersRepository.findValidToken(dto.token);
    if (!tokenData)
      throw new BadRequestException('Token không hợp lệ hoặc hết hạn');
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(dto.newPassword, salt);
    await this.usersRepository.updatePasswordAndToken(
      tokenData.userId,
      hashedPassword,
      tokenData.id,
    );
    return { message: 'Mật khẩu đã được cập nhật thành công' };
  }
}
