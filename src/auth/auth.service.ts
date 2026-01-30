import { BadRequestException, Injectable } from '@nestjs/common';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import { UsersRepository } from '../user/user.repository';
import { TokenPayload } from './type/accessToken.type';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from 'src/user/user.entity';
import { UpdateUserProfileDto } from './dto/user.profile.dto';
import { UploadService } from 'src/common/upload/upload.service';
@Injectable()
export class AuthService {
  constructor(
    private usersRepository: UsersRepository,
    private uploadService: UploadService,
  ) {}

  async signUp(createUserDto: CreateUserDto): Promise<User> {
    return await this.usersRepository.createUser(createUserDto);
  }

  async signIn(authCredentialsDto: AuthCredentialsDto): Promise<TokenPayload> {
    return await this.usersRepository.signIn(authCredentialsDto);
  }
  async refreshTokens(
    userId: string,
    refreshToken: string,
    oldAccessToken: string,
  ): Promise<TokenPayload> {
    return await this.usersRepository.refreshTokens(
      userId,
      refreshToken,
      oldAccessToken,
    );
  }

  async signOut(userId: string, accessToken: string): Promise<void> {
    await this.usersRepository.logout(userId, accessToken);
  }

  async googleLogin(user: any) {
    if (!user) {
      throw new BadRequestException('No user from google');
    }
    return await this.usersRepository.findOrCreateGoogleUser(user);
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
