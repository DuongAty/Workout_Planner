import {
  Body,
  Controller,
  Logger,
  Post,
  Get,
  UseGuards,
  Req,
  Res,
  Param,
  Patch,
  ForbiddenException,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import { TokenPayload } from './type/accessToken.type';
import { ApiBearerAuth, ApiBody, ApiConsumes } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from 'src/user/user.entity';
import { ConfigService } from '@nestjs/config';
import { UpdateUserProfileDto } from './dto/user.profile.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { mediaFileFilter, storageConfig } from 'src/common/upload/file-upload';
import { IMAGE_MIMETYPE_REGEX } from 'src/common/upload/file-upload.constants';
import { buildGoogleAuthSuccessHtml } from 'src/common/googleUtils/google-utils';
import { AuthProvider } from 'src/common/enum/user-enum';

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
    return req.user;
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

  @Get('extract') async extractUser(
    @Query('code') code: string,
    @Query('provider') provider: AuthProvider,
  ) {
    return await this.authService.extractUserInfoFromCode(code, provider);
  }

  @Get('login') async loginBy(
    @Query('code') code: string,
    @Query('provider') provider: AuthProvider,
  ) {
    return await this.authService.loginBy(provider, code);
  }

  @UseGuards(AuthGuard('google'))
  @Get('google/callback')
  async validateGoogleCode(@Query('code') code: string) {
    const tokens = await this.authService.loginBy(AuthProvider.GOOGLE, code);
    return tokens;
  }

  @Patch(':id/update-user')
  @ApiBearerAuth('accessToken')
  @UseGuards(AuthGuard())
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserProfileDto: UpdateUserProfileDto,
    @Req() req: any,
  ) {
    if (req.user.id !== id) {
      throw new ForbiddenException(
        'You do not have permission to edit this information.',
      );
    }
    return this.authService.updateUser(id, updateUserProfileDto);
  }

  @Post(':id/upload-avatar')
  @ApiBearerAuth('accessToken')
  @UseGuards(AuthGuard())
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
}
