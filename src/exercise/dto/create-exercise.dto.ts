import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsInt, Min, IsEnum, Max } from 'class-validator';
import { MuscleGroup } from '../exercise-musclegroup';
import { Transform, Type } from 'class-transformer';

export class CreateExerciseDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @ApiProperty({
    description: 'Exercies Name',
  })
  name: string;

  @ApiProperty({
    description: 'Muscle Group',
    enum: MuscleGroup,
    required: false,
  })
  @IsNotEmpty()
  @IsEnum(MuscleGroup, {
    message: 'Please select a valid muscle group from the list.',
  })
  muscleGroup?: MuscleGroup;

  @IsInt()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  @IsNotEmpty()
  @ApiProperty({
    description: 'Groups of repetitions',
    example: 3,
  })
  numberOfSets: number;

  @IsInt()
  @Min(1)
  @Max(15)
  @Type(() => Number)
  @IsNotEmpty()
  @ApiProperty({
    description: 'Number of repetitions of the movement',
    example: 12,
  })
  repetitions: number;

  @IsInt()
  @Min(60)
  @Max(600)
  @Type(() => Number)
  @IsNotEmpty()
  @ApiProperty({
    description: 'Rest time',
    example: 60,
  })
  restTime: number;

  @IsInt()
  @Min(60)
  @Max(600)
  @Type(() => Number)
  @IsNotEmpty()
  @ApiProperty({
    description: 'Total time of exercise',
    example: 300,
  })
  duration: number;

  @IsString()
  @IsNotEmpty()
  @Max(100)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @ApiProperty({
    description: 'Note',
  })
  note?: string;
}
