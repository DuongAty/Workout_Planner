import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsInt,
  Min,
  IsEnum,
  Max,
  MaxLength,
} from 'class-validator';
import { MuscleGroup } from '../exercise-musclegroup';
import { Transform, Type } from 'class-transformer';
import { MAX_TIME, MIN_TIME, trim } from 'src/constants/constants';
import { i18nValidationMessage } from 'nestjs-i18n';

export class CreateExerciseDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50, {
    message: i18nValidationMessage('common.validation.MaxLength'),
  })
  @Transform(trim)
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
    message: i18nValidationMessage('common.validation.IsEnum'),
  })
  muscleGroup?: MuscleGroup;

  @IsInt()
  @Min(1, { message: i18nValidationMessage('common.validation.Min') })
  @Max(5, { message: i18nValidationMessage('common.validation.Max') })
  @Type(() => Number)
  @IsNotEmpty()
  @ApiProperty({
    description: 'Groups of repetitions',
    example: 3,
  })
  numberOfSets: number;

  @IsInt()
  @Min(1, { message: i18nValidationMessage('common.validation.Min') })
  @Max(15, { message: i18nValidationMessage('common.validation.Max') })
  @Type(() => Number)
  @IsNotEmpty()
  @ApiProperty({
    description: 'Number of repetitions of the movement',
    example: 12,
  })
  repetitions: number;

  @IsInt()
  @Min(MIN_TIME, { message: i18nValidationMessage('common.validation.Min') })
  @Max(MAX_TIME, { message: i18nValidationMessage('common.validation.Max') })
  @Type(() => Number)
  @IsNotEmpty()
  @ApiProperty({
    description: 'Rest time',
    example: 60,
  })
  restTime: number;

  @IsInt()
  @Min(MIN_TIME, { message: i18nValidationMessage('common.validation.Min') })
  @Max(MAX_TIME, { message: i18nValidationMessage('common.validation.Max') })
  @Type(() => Number)
  @IsNotEmpty()
  @ApiProperty({
    description: 'Total time of exercise',
    example: 300,
  })
  duration: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100, {
    message: i18nValidationMessage('common.validation.MaxLength'),
  })
  @Transform(trim)
  @ApiProperty({
    description: 'Note',
  })
  note?: string;
}
