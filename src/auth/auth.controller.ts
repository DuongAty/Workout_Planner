import {
  Body,
  Controller,
  Logger,
  Post,
  Get,
  UseGuards,
  Req,
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import { TokenPayload } from './type/accessToken.type';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from 'src/user/user.entity';
import { ConfigService } from '@nestjs/config';

@Controller({ path: 'auth', version: '1' })
export class AuthController {
  private logger = new Logger('AuthController');
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  private extractToken(req: Request): string | null {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return null;
    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : null;
  }

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
    const { id, fullname, username, avatar, email } = req.user;
    return { id, fullname, username, avatar, email };
  }

  @UseGuards(AuthGuard())
  @Post('/logout')
  async logout(@Req() req: any) {
    const userId = req.user.id;
    const accessToken = this.extractToken(req) || '';
    return this.authService.signOut(userId, accessToken);
  }

  @Post('/refresh')
  async refresh(
    @Body('userId') userId: string,
    @Body('refreshToken') refreshToken: string,
    @Req() req: any,
  ) {
    const oldAccessToken = this.extractToken(req) || '';
    return this.authService.refreshTokens(userId, refreshToken, oldAccessToken);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth(@Req() req) {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req, @Res() res) {
    const user = req.user;

    if (!user) {
      return res.redirect(
        `${this.configService.get('FRONTEND_URL')}/login?error=no_user`,
      );
    }

    const { accessToken, refreshToken } =
      await this.authService.googleLogin(user);

    const clientUrl = this.configService.get<string>('FRONTEND_URL');

    return res.redirect(
      `${clientUrl}/auth/google/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`,
    );
  }
}
