import { DocumentBuilder, OpenAPIObject } from '@nestjs/swagger';

export function WorkoutDocumentConfig(): Omit<OpenAPIObject, 'paths'> {
  const workoutConfig = new DocumentBuilder()
    .setTitle('WorkoutPlan')
    .setVersion('1.0')
    .build();
  return workoutConfig;
}
export function ExerciestDocumentConfig(): Omit<OpenAPIObject, 'paths'> {
  const exerciestConfig = new DocumentBuilder()
    .setTitle('Exercies')
    .setVersion('1.0')
    .build();
  return exerciestConfig;
}
