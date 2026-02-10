import {
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
import { UpdateUserProfileDto } from '../auth/dto/user.profile.dto';
import { AuthProvider } from '../common/enum/user-enum';
@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
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

  async updateRefreshToken(userId: string, hashedRefreshToken: string) {
    await this.userRepository.update(userId, {
      refreshToken: hashedRefreshToken,
    });
  }

  async clearRefreshToken(userId: string) {
    await this.userRepository.update(userId, {
      refreshToken: null,
    });
  }

  async findOrCreateSocialUser(googleUser: any) {
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
        throw new ConflictException(
          'Email này đã được sử dụng bởi một tài khoản khác',
        );
      }
    }
    await this.userRepository.update(user.id, updateUserDto);
    const updatedUser = await this.userRepository.findOneBy({ id: userId });
    return updatedUser;
  }

  async updateAvatar(userId: string, avatarPath: string) {
    return await this.updateUser(userId, { avatar: avatarPath });
  }
}
