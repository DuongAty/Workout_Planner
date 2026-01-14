import {
  Body,
  Controller,
  Logger,
  Post,
  Get,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import { TokenPayload } from './type/accessToken.type';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from 'src/user/user.entity';

@Controller({ path: 'auth', version: '1' })
export class AuthController {
  private logger = new Logger('AuthController');
  constructor(private authService: AuthService) {}

  @Post('/register')
  signUp(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.authService.signUp(createUserDto);
  }

  @Post('/login')
  signIn(
    @Body() authCredentialsDto: AuthCredentialsDto,
  ): Promise<TokenPayload> {
    return this.authService.signIn(authCredentialsDto);
  }

  @Get('/me')
  @ApiBearerAuth('accessToken')
  @UseGuards(AuthGuard())
  getMe(@Req() req) {
    const { id, fullname, username } = req.user;
    return { id, fullname, username };
  }

  @UseGuards(AuthGuard())
  @Post('/logout')
  async logout(@Req() req: any) {
    const userId = req.user.id;
    const accessToken = req.get('Authorization').replace('Bearer ', '');
    return this.authService.signOut(userId, accessToken);
  }

  @Post('/refresh')
  async refresh(
    @Body('userId') userId: string,
    @Body('refreshToken') refreshToken: string,
    @Req() req: any,
  ) {
    const oldAccessToken =
      req.get('Authorization')?.replace('Bearer ', '') || '';
    return this.authService.refreshTokens(userId, refreshToken, oldAccessToken);
  }
}
