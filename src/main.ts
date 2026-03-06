import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule } from '@nestjs/swagger';
import { DocumentConfig } from './document-builder';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { I18nValidationExceptionFilter, I18nValidationPipe } from 'nestjs-i18n';

async function bootstrap() {
  const logger = new Logger();
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);
  app.enableCors();
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });
  app.enableVersioning({
    type: VersioningType.URI,
  });

  const port = configService.get<number>('PORT')!;
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new I18nValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  app.useGlobalFilters(
    new I18nValidationExceptionFilter({ detailedErrors: false }),
  );
  const config = DocumentConfig();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
  await app.listen(port);
  logger.log(`Port ${port}`);
}
bootstrap();
