import { ApiProperty } from '@nestjs/swagger';
import { MuscleGroup } from '../exercise-musclegroup';
import { IsEnum, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateExerciseDto {
  @ApiProperty({
    required: false,
    description: 'Exercise Name',
  })
  name: string;

  @ApiProperty({
    description: 'Muscle Group',
    enum: MuscleGroup,
    required: false,
  })
  @IsOptional()
  @IsEnum(MuscleGroup, {
    message: 'Please select a valid muscle group from the list.',
  })
  muscleGroup?: MuscleGroup;

  @ApiProperty({
    required: false,
    description: 'Groups of repetitions',
    example: 3,
  })
  @Type(() => Number)
  numberOfSets: number;

  @ApiProperty({
    required: false,
    description: 'Number of repetitions of the movement',
    example: 12,
  })
  @Type(() => Number)
  repetitions: number;

  @ApiProperty({
    required: false,
    description: 'Rest time ',
  })
  @Type(() => Number)
  restTime: number;

  @ApiProperty({
    required: false,
    description: 'Total time of exercise ',
  })
  @Type(() => Number)
  duration: number;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    required: false,
  })
  thumbnail: any;

  @ApiProperty({
    required: false,
    description: 'Note',
  })
  note: string;
}
