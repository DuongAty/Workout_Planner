import { ApiProperty } from '@nestjs/swagger';
import { MuscleGroup } from '../exercise-musclegroup';
import { IsEnum, IsOptional, IsString, Max, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class UpdateExerciseDto {
  @ApiProperty({
    required: false,
    description: 'Exercise Name',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString()
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
  @IsOptional()
  @Min(1)
  @Max(5)
  numberOfSets: number;

  @ApiProperty({
    required: false,
    description: 'Number of repetitions of the movement',
    example: 12,
  })
  @Type(() => Number)
  @Min(1)
  @Max(15)
  repetitions: number;

  @ApiProperty({
    required: false,
    description: 'Rest time ',
  })
  @Type(() => Number)
  @Min(0)
  @Max(600)
  restTime: number;

  @ApiProperty({
    required: false,
    description: 'Total time of exercise ',
  })
  @Type(() => Number)
  @Min(0)
  @Max(600)
  duration: number;

  @ApiProperty({
    required: false,
    description: 'Note',
  })
  @Max(100)
  note: string;
}
