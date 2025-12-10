import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { configValidationSchema } from './config.schema';
import { WorkoutplanModule } from './workoutplan/workoutplan.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: [`.env.stage.${process.env.STAGE}`],
      validationSchema: configValidationSchema,
    }),
    WorkoutplanModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const isProduction = configService.get('STAGE') === 'prod';
        let sslConfig = {};
        let extraConfig = {};

        if (isProduction) {
          sslConfig = {
            ssl: true,
          };
          extraConfig = {
            extra: {
              ssl: {
                rejectUnauthorized: false,
              },
            },
          };
        }
        return {
          ssl: isProduction,
          extra: {
            ssl: isProduction ? { rejectUnauthoried: false } : null,
          },
          type: 'postgres',
          ...sslConfig,
          ...extraConfig,
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          synchronize: true,
          host: configService.get('DB_HOST'),
          port: configService.get('DB_PORT'),
          username: configService.get('DB_USERNAME'),
          password: configService.get('DB_PASSWORD'),
          database: configService.get('DB_DATABASE'),
        };
      },
    }),

    AuthModule,
  ],
})
export class AppModule {}
