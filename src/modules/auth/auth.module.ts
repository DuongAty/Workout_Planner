import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersRepository } from '../user/user.repository';
import { JwtStrategy } from '../user/jwt-strategy';
import { User } from '../user/user.entity';
import {
  JWT_STRATEGY,
  JWT_EXPIRES_IN,
  ConfigKey,
} from '../../constants/constants';
import { RedisService } from './../../redis/redis.service';
import { UploadService } from '../../upload/upload.service';
import { OAuth2Client } from 'google-auth-library';
import { GoogleStrategy } from '../user/strategy/google.strategy';
import { FacebookStrategy } from '../user/strategy/facebook.strategy';
import { Token } from '../user/fcmToken/token.entity';
import { NutritionService } from '../nutrition/nutrition.service';
import { NutritionLog } from '../nutrition/nutrition-log.entity';
import { Workout } from '../workoutplan/workoutplan.entity';
import { OpenAIService } from '../openai/openai.service';
import { BullModule } from '@nestjs/bull';
import { JobsModule } from 'src/jobs/job.module';

@Module({
  imports: [
    ConfigModule,
    JobsModule,
    PassportModule.register({ defaultStrategy: JWT_STRATEGY }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get(ConfigKey.JWT_SECRET),
        signOptions: {
          expiresIn: JWT_EXPIRES_IN,
        },
      }),
    }),
    TypeOrmModule.forFeature([User, Token, NutritionLog, Workout]),
    BullModule.registerQueue({ name: 'email' }),
  ],
  providers: [
    AuthService,
    UsersRepository,
    JwtStrategy,
    GoogleStrategy,
    FacebookStrategy,
    RedisService,
    UploadService,
    OAuth2Client,
    NutritionService,
    OpenAIService,
  ],
  controllers: [AuthController],
  exports: [JwtStrategy, PassportModule, UsersRepository, NutritionService],
})
export class AuthModule {}
