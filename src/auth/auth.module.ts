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
import { JWT_STRATEGY, JWT_EXPIRES_IN, ConfigKey } from './auth-constants';
import { RedisService } from 'src/redis/redis.service';

@Module({
  imports: [
    ConfigModule,
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
    TypeOrmModule.forFeature([User]),
  ],
  providers: [AuthService, UsersRepository, JwtStrategy, RedisService],
  controllers: [AuthController],
  exports: [JwtStrategy, PassportModule],
})
export class AuthModule {}
