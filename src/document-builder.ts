import { DocumentBuilder, OpenAPIObject } from '@nestjs/swagger';

export function DocumentConfig(): Omit<OpenAPIObject, 'paths'> {
  const config = new DocumentBuilder()
    .setTitle('API Documentation')
    .setDescription(
      'API documentation for Auth, Exercise và Workout Plan modules',
    )
    .setVersion('1.0')
    .addTag('Auth')
    .addTag('Workoutplan')
    .addTag('Exercise')
    .addBearerAuth(
      {
        bearerFormat: 'JWT',
        scheme: 'Bearer',
        type: 'http',
      },
      'accessToken',
    )
    .build();
  return config;
}
