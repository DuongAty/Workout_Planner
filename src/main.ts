import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule } from '@nestjs/swagger';
import { WorkoutplanModule } from './workoutplan/workoutplan.module';
import {
  ExerciestDocumentConfig,
  WorkoutDocumentConfig,
} from './document-builder';
import { ExerciseModule } from './exercise/exercise.module';

async function bootstrap() {
  const logger = new Logger();
  const app = await NestFactory.create(AppModule);
  app.enableVersioning({
    type: VersioningType.URI,
  });
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT')!;
  app.enableCors();
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  const workoutConfig = WorkoutDocumentConfig();
  const workoutDocumentFactory = () =>
    SwaggerModule.createDocument(app, workoutConfig, {
      include: [WorkoutplanModule],
    });
  SwaggerModule.setup('api/workout', app, workoutDocumentFactory);

  const exerciestConfig = ExerciestDocumentConfig();
  const exerciesDocumentFactory = () =>
    SwaggerModule.createDocument(app, exerciestConfig, {
      include: [ExerciseModule],
    });
  SwaggerModule.setup('api/exercies', app, exerciesDocumentFactory);
  await app.listen(port);
  logger.log(`Port ${port}`);
}
bootstrap();
