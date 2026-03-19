import {
  Body,
  Controller,
  Logger,
  Post,
  Get,
  UseGuards,
  Req,
  Param,
  Patch,
  ForbiddenException,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import { TokenPayload } from './type/accessToken.type';
import { ApiBearerAuth, ApiBody, ApiConsumes } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CreateUserDto } from './dto/create-user.dto';
import { ConfigService } from '@nestjs/config';
import { UpdateTokenDto, UpdateUserProfileDto } from './dto/user.profile.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { mediaFileFilter, storageConfig } from 'src/upload/file-upload';
import { IMAGE_MIMETYPE_REGEX } from 'src/upload/file-upload.constants';
import { User } from 'src/modules/user/user.entity';
import { GetUser } from '../user/get-user.decorator';
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto/change-password.dto';
import { AppLogger } from 'src/loggers/app-logger.service';
import { OwnerMiddleware } from 'src/middleware/owner.middleware';

@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
    private logger: AppLogger,
  ) {}

  private extractToken(req: Request): string | null {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return null;
    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : null;
  }

  @Post('/register')
  signUp(@Body() createUserDto: CreateUserDto): Promise<User> {
    this.logger.logData('Created user', createUserDto, AuthController.name);
    return this.authService.signUp(createUserDto);
  }

  @Post('/login')
  signIn(
    @Body() authCredentialsDto: AuthCredentialsDto,
  ): Promise<TokenPayload> {
    this.logger.logData('Sign in', authCredentialsDto, AuthController.name);
    return this.authService.signIn(authCredentialsDto);
  }

  @Get('/me')
  @ApiBearerAuth('accessToken')
  @UseGuards(AuthGuard(), OwnerMiddleware)
  getMe(@Req() req) {
    return req.user;
  }

  @UseGuards(AuthGuard())
  @Post('/logout')
  async logout(@Req() req: any) {
    const userId = req.user.id;
    const accessToken = this.extractToken(req) || '';
    return this.authService.signOut(userId, accessToken);
  }

  @UseGuards(AuthGuard())
  @Patch('fcm-token')
  async updateFcmToken(@Body() dto: UpdateTokenDto, @GetUser() user: User) {
    return this.authService.updateToken(user.id, dto);
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

  @Post('google')
  async authenticate(@Body('code') code: string) {
    return await this.authService.googleLogin(code);
  }

  @Post('facebook')
  async facebookAuth(@Body('code') code: string) {
    return this.authService.facebookLogin(code);
  }

  @Patch(':id/update-user')
  @ApiBearerAuth('accessToken')
  @UseGuards(AuthGuard(), OwnerMiddleware)
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserProfileDto: UpdateUserProfileDto,
    @Req() req: any,
  ) {
    this.logger.logData(
      `Update user with Id ${id}`,
      updateUserProfileDto,
      AuthController.name,
    );
    return this.authService.updateUser(id, updateUserProfileDto);
  }

  @Post(':id/upload-avatar')
  @ApiBearerAuth('accessToken')
  @UseGuards(AuthGuard(), OwnerMiddleware)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: storageConfig('avatar'),
      fileFilter: mediaFileFilter,
    }),
  )
  async uploadAvatar(@Req() req, @UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Please select an image file!');
    }
    if (!file.mimetype.match(IMAGE_MIMETYPE_REGEX)) {
      throw new BadRequestException(
        'Avatar must be an image format (jpg, jpeg, png, gif, webp...)',
      );
    }
    return await this.authService.updateAvatar(req.user.id, file);
  }

  @Patch('change-password')
  @ApiBearerAuth('accessToken')
  @UseGuards(AuthGuard())
  async changePassword(@Req() req, @Body() dto: ChangePasswordDto) {
    this.logger.logData('Change password', dto, AuthController.name);
    return this.authService.changePassword(req.user.id, dto);
  }

  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    this.logger.logData('Forgot password', dto, AuthController.name);
    return this.authService.forgotPassword(dto);
  }

  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    this.logger.logData('Reset password', dto, AuthController.name);
    return this.authService.resetPassword(dto);
  }
}
