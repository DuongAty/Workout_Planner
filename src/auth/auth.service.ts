import { Injectable } from '@nestjs/common';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import { UsersRepository } from '../user/user.repository';
import { AccessTokenPayload } from './type/accessToken.type';
import { CreateUserDto } from './dto/create-user.dto';
@Injectable()
export class AuthService {
  constructor(private usersRepository: UsersRepository) {}

  async signUp(createUserDto: CreateUserDto): Promise<void> {
    await this.usersRepository.createUser(createUserDto);
  }

  async signIn(
    authCredentialsDto: AuthCredentialsDto,
  ): Promise<AccessTokenPayload> {
    return await this.usersRepository.signIn(authCredentialsDto);
  }
}
