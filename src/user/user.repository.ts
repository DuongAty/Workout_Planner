import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { AuthCredentialsDto } from '../auth/dto/auth-credentials.dto';
import { JwtPayload } from './jwt-payload.interface';
import { User } from './user.entity';
import {
  PASSWORD_INCORRECT_MESSAGE,
  USERNAME_NOT_FOUND_MESSAGE,
} from '../auth/auth-constants';
import { AccessTokenPayload } from '../auth/type/accessToken.type';
@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async createUser(authCredentialsDto: AuthCredentialsDto): Promise<void> {
    const { username, password } = authCredentialsDto;
    const existingUser = await this.userRepository.findOneBy({ username });
    if (existingUser) {
      throw new ConflictException('Username already exits');
    }
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);
    const user = this.userRepository.create({
      username,
      password: hashedPassword,
    });
    try {
      await this.userRepository.save(user);
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  async signIn(
    authCredentialsDto: AuthCredentialsDto,
  ): Promise<AccessTokenPayload> {
    const { username, password } = authCredentialsDto;
    const user = await this.userRepository.findOneBy({ username });
    if (!user) {
      throw new UnauthorizedException({
        status: 401,
        error: USERNAME_NOT_FOUND_MESSAGE,
      });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException({
        status: 401,
        error: PASSWORD_INCORRECT_MESSAGE,
      });
    }
    const payload: JwtPayload = { username };
    const accessToken: string = this.jwtService.sign(payload);
    return { accessToken };
  }
  async getUser(accessToken: string): Promise<User> {
    try {
      const payload: JwtPayload =
        await this.jwtService.verifyAsync(accessToken);

      const { username } = payload;
      const user = await this.userRepository.findOneBy({ username });

      if (!user) {
        throw new UnauthorizedException(
          'Người dùng không tồn tại hoặc token không hợp lệ',
        );
      }
      return user;
    } catch (error) {
      throw new UnauthorizedException('Token không hợp lệ hoặc đã hết hạn');
    }
  }
}
