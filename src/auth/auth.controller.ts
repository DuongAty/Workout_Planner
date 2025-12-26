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
import { AccessTokenPayload } from './type/accessToken.type';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

@Controller({ path: 'auth', version: '1' })
export class AuthController {
  private logger = new Logger('AuthController');
  constructor(private authService: AuthService) {}

  @Post('/register')
  signUp(@Body() authCredentialsDto: AuthCredentialsDto): Promise<void> {
    return this.authService.signUp(authCredentialsDto);
  }

  @Post('/login')
  signIn(
    @Body() authCredentialsDto: AuthCredentialsDto,
  ): Promise<AccessTokenPayload> {
    return this.authService.signIn(authCredentialsDto);
  }
  @Get('/me')
  @ApiBearerAuth('accessToken')
  @UseGuards(AuthGuard())
  getMe(@Req() req) {
    return { username: req.user.username };
  }
}
