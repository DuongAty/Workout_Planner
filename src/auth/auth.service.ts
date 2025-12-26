import { Injectable } from '@nestjs/common';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import { UsersRepository } from '../user/user.repository';
import { AccessTokenPayload } from './type/accessToken.type';
import { User } from '../user/user.entity';
@Injectable()
export class AuthService {
  constructor(private usersRepository: UsersRepository) {}

  async signUp(authCredentialsDto: AuthCredentialsDto): Promise<void> {
    await this.usersRepository.createUser(authCredentialsDto);
  }

  async signIn(
    authCredentialsDto: AuthCredentialsDto,
  ): Promise<AccessTokenPayload> {
    return await this.usersRepository.signIn(authCredentialsDto);
  }

  async getUser(accessToken: string): Promise<User> {
    return await this.usersRepository.getUser(accessToken);
  }
}
