import { Max } from 'class-validator';

export class CreateStepDto {
  order: number;

  @Max(100)
  description: string;

  exerciseId: string;
}

export class UpdateStepDto {
  order: number;

  @Max(100)
  description: string;
}
