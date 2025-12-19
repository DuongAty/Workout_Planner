import { DocumentBuilder, OpenAPIObject } from '@nestjs/swagger';

export function WorkoutDocumentConfig(): Omit<OpenAPIObject, 'paths'> {
  const workoutConfig = new DocumentBuilder()
    .setTitle('WorkoutPlan')
    .setVersion('1.0')
    .addBearerAuth(
      {
        bearerFormat: 'JWT',
        scheme: 'Bearer',
        type: 'http',
      },
      'accessToken',
    )
    .build();
  return workoutConfig;
}

export function ExerciestDocumentConfig(): Omit<OpenAPIObject, 'paths'> {
  const exerciestConfig = new DocumentBuilder()
    .setTitle('Exercies')
    .setVersion('1.0')
    .addBearerAuth(
      {
        bearerFormat: 'JWT',
        scheme: 'Bearer',
        type: 'http',
      },
      'accessToken',
    )
    .build();
  return exerciestConfig;
}

export function AuthDocumentConfig(): Omit<OpenAPIObject, 'paths'> {
  const authConfig = new DocumentBuilder()
    .setTitle('User')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  return authConfig;
}
