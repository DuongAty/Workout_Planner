import {
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { AuthCredentialsDto } from '../auth/dto/auth-credentials.dto';
import { JwtPayload } from './jwt-payload.interface';
import { User } from './user.entity';
import { PASSWORD_INCORRECT_MESSAGE, USERNAME_NOT_FOUND_MESSAGE } from 'src/auth/auth-constants';
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
  ): Promise<{ accessToken: string }> {
    const { username, password } = authCredentialsDto;
    const user = await this.userRepository.findOneBy({ username });
    if (!user) {
      throw new HttpException(
        {
          statusCode: HttpStatus.UNAUTHORIZED,
          error: 'Unauthorized',
          message: USERNAME_NOT_FOUND_MESSAGE,
        },
        HttpStatus.UNAUTHORIZED,
      );
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new HttpException(
        {
          statusCode: HttpStatus.UNAUTHORIZED,
          error: 'Unauthorized',
          message: PASSWORD_INCORRECT_MESSAGE,
        },
        HttpStatus.UNAUTHORIZED,
      );
    }
    const payload: JwtPayload = { username };
    const accessToken: string = this.jwtService.sign(payload);
    return { accessToken };
  }
}
