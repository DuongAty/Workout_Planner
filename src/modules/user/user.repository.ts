import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity';
import { CreateUserDto } from '../auth/dto/create-user.dto';
import {
  UpdateTokenDto,
  UpdateUserProfileDto,
} from '../auth/dto/user.profile.dto';
import { AuthProvider } from '../../enums/user-enum';
import { Token } from './fcmToken/token.entity';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { JobService } from 'src/jobs/job.service';
import { I18nContext } from 'nestjs-i18n';
import { SocialUserPayload } from 'src/interfaces/interface';
@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Token)
    private tokenRepository: Repository<Token>,
    @InjectQueue('email') private mailQueue: Queue,
    private jobService: JobService,
  ) {}

  async createUser(createUserDto: CreateUserDto): Promise<User> {
    const { email, fullname, username, password } = createUserDto;
    const existingUser = await this.userRepository.findOneBy([
      { username },
      { email },
    ]);
    if (existingUser) {
      throw new ConflictException('Username or Email already exits');
    }
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);
    const user = this.userRepository.create({
      email,
      fullname,
      username,
      password: hashedPassword,
      provider: AuthProvider.LOCAL,
    });
    try {
      const saveUser = await this.userRepository.save(user);
      const currentLang = I18nContext.current()?.lang || 'vi';
      await this.jobService.addRegisterEmailJob({
        email: saveUser.email,
        fullname: saveUser.fullname,
        lang: currentLang,
      });
      return saveUser;
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  async updateRefreshToken(userId: string, hashedRefreshToken: string) {
    await this.userRepository.update(userId, {
      refreshToken: hashedRefreshToken,
    });
  }
  async updateToken(userId: string, dto: UpdateTokenDto) {
    const existingToken = await this.tokenRepository.findOne({
      where: { userId: userId, device: 'web' },
    });
    if (existingToken) {
      return await this.tokenRepository.update(existingToken.id, {
        fcmToken: dto.fcmToken,
      });
    } else {
      const newToken = this.tokenRepository.create({
        fcmToken: dto.fcmToken,
        userId: userId,
        device: 'web',
      });
      return await this.tokenRepository.save(newToken);
    }
  }

  async clearRefreshToken(userId: string) {
    await this.userRepository.update(userId, {
      refreshToken: null,
    });
  }

  async findOrCreateSocialUser(googleUser: SocialUserPayload) {
    const { email, firstName, lastName, picture, provider, providerId } =
      googleUser;
    let user = await this.userRepository.findOneBy({ email });
    if (!user) {
      user = this.userRepository.create({
        email,
        fullname: `${firstName || ''} ${lastName || ''}`.trim(),
        username: `${email.split('@')[0]}-${providerId.toString().slice(-4)}`,
        avatar: picture,
        provider: provider,
        providerId: providerId,
      });
      await this.userRepository.save(user);
    }
    return user;
  }

  async findUserByUsername(username: string) {
    return await this.userRepository.findOneBy({ username });
  }

  async findUser(userId: string) {
    try {
      return await this.userRepository.findOneBy({ id: userId });
    } catch (error) {
      throw new NotFoundException('User not found');
    }
  }

  async updateUser(userId: string, updateUserDto: UpdateUserProfileDto) {
    try {
      const { email } = updateUserDto;
      const user = await this.findUser(userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }
      if (email) {
        const existingUser = await this.userRepository.findOne({
          where: { email, id: Not(userId) },
        });
        if (existingUser) {
          throw new ConflictException('Email already exists!');
        }
      }
      await this.userRepository.update(user.id, updateUserDto);
      const updatedUser = await this.userRepository.findOneBy({ id: userId });
      return updatedUser;
    } catch (err) {
      throw new BadRequestException('DB Error: ' + err.message);
    }
  }

  async updateAvatar(userId: string, avatarPath: string) {
    return await this.updateUser(userId, { avatar: avatarPath });
  }
}
