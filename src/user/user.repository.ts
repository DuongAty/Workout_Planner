import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { AuthCredentialsDto } from '../auth/dto/auth-credentials.dto';
import { AuthProvider, User } from './user.entity';
import { CreateUserDto } from 'src/auth/dto/create-user.dto';
import { RedisService } from 'src/redis/redis.service';
import { TokenPayload } from 'src/auth/type/accessToken.type';
import {
  ACCESS_TOKEN_BLACKLIST_TTL,
  ACCESS_TOKEN_TTL,
  REFRESH_TOKEN_TTL,
} from 'src/common/constants/constants';
import { UpdateUserProfileDto } from 'src/auth/dto/user.profile.dto';
@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private redisService: RedisService,
  ) {}

  async createUser(createUserDto: CreateUserDto): Promise<User> {
    const { fullname, username, password } = createUserDto;
    const existingUser = await this.userRepository.findOneBy({ username });
    if (existingUser) {
      throw new ConflictException('Username already exits');
    }
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);
    const user = this.userRepository.create({
      fullname,
      username,
      password: hashedPassword,
      provider: AuthProvider.LOCAL,
    });
    try {
      return await this.userRepository.save(user);
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  async signIn(authCredentialsDto: AuthCredentialsDto) {
    const { username, password } = authCredentialsDto;
    const user = await this.userRepository.findOneBy({ username });
    if (user && (await bcrypt.compare(password, user.password))) {
      const tokens = await this.getTokens(user.id, user.username);
      await this.updateRefreshToken(user.id, tokens.refreshToken);
      return tokens;
    } else {
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  async getTokens(userId: string, username: string) {
    const payload = { sub: userId, username };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, { expiresIn: ACCESS_TOKEN_TTL }),
      this.jwtService.signAsync(payload, { expiresIn: REFRESH_TOKEN_TTL }),
    ]);
    return { accessToken, refreshToken };
  }

  async updateRefreshToken(userId: string, refreshToken: string) {
    const salt = await bcrypt.genSalt();
    const hashedRefreshToken = await bcrypt.hash(refreshToken, salt);
    await this.userRepository.update(userId, {
      refreshToken: hashedRefreshToken,
    });
  }

  async logout(userId: string, accessToken: string) {
    await this.userRepository.update(userId, {
      refreshToken: null,
    });
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
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('Access Denied');
    }
    const refreshTokenMatches = await bcrypt.compare(
      refreshToken,
      user.refreshToken,
    );
    if (!refreshTokenMatches) {
      await this.logout(userId, oldAccessToken);
      throw new UnauthorizedException('Token detected as reused/invalid');
    }
    await this.redisService.blacklistToken(oldAccessToken, 900);
    const tokens = await this.getTokens(user.id, user.username);
    await this.updateRefreshToken(user.id, tokens.refreshToken);
    return tokens;
  }

  async findOrCreateGoogleUser(googleUser: any) {
    const { email, firstName, lastName, picture, provider, providerId } = googleUser;
    let user = await this.userRepository.findOneBy({ email });
    if (!user) {
      user = this.userRepository.create({
        email,
        fullname: `${firstName || ''} ${lastName || ''}`.trim(),
        username: email.split('@')[0],
        avatar: picture,
        provider: provider,
        providerId: providerId,
      });
      await this.userRepository.save(user);
    }
    const tokens = await this.getTokens(user.id, user.username);
    await this.updateRefreshToken(user.id, tokens.refreshToken);
    return tokens;
  }
  async findUser(userId: string) {
    try {
      return await this.userRepository.findOneBy({ id: userId });
    } catch (error) {
      throw new NotFoundException('User not found');
    }
  }
  async updateUser(userId: string, updateUserDto: UpdateUserProfileDto) {
    const user = await this.findUser(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    await this.userRepository.update(user.id, updateUserDto);
    const updatedUser = await this.userRepository.findOneBy({ id: userId });
    return updatedUser;
  }

  async updateAvatar(userId: string, avatarPath: string) {
    return await this.updateUser(userId, { avatar: avatarPath });
  }
}
