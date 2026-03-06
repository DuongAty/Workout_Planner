import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Max,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { trim } from 'src/constants/constants';
import { IsFutureDate } from '../../../decorators/is-future-date.decorator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class UpdateWorkoutDto {
  @IsNotEmpty()
  @IsOptional()
  @Transform(trim)
  @ApiProperty({
    description: 'Name',
  })
  name?: string;

  @ApiProperty({ example: '2026-01-05' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ example: '2026-01-12' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({
    example: [1, 3, 5],
    description: 'Thứ trong tuần (1: T2, 3: T4, 5: T6)',
    required: false,
  })
  @IsOptional()
  @IsArray({ message: i18nValidationMessage('common.validation.IsArray') })
  @ArrayUnique()
  @ArrayMinSize(1, { message: i18nValidationMessage('common.validation.Min') })
  @Min(0, {
    each: true,
    message: i18nValidationMessage('common.validation.Min'),
  })
  @Max(6, {
    each: true,
    message: i18nValidationMessage('common.validation.Max'),
  })
  @IsNumber(
    {},
    {
      each: true,
      message: i18nValidationMessage('common.validation.IsNumber'),
    },
  )
  daysOfWeek?: number[];
}

export class UpdateScheduleDto {
  @ApiProperty({ example: '2026-02-20' })
  @IsOptional()
  @IsDateString()
  oldDate?: string;

  @ApiProperty({ example: '2026-02-20' })
  @IsOptional()
  @IsFutureDate()
  @IsDateString()
  newDate?: string;
}

export class UpdateDaysOfWeekDto {
  @ApiProperty({
    example: [0, 2, 4, 6],
    description: 'The days of the week (0: CN, 1: T2...)',
  })
  @IsArray({ message: i18nValidationMessage('common.validation.IsArray') })
  @ArrayUnique()
  @ArrayMinSize(1, { message: i18nValidationMessage('common.validation.Min') })
  @IsNumber(
    {},
    {
      each: true,
      message: i18nValidationMessage('common.validation.IsNumber'),
    },
  )
  @Min(0, {
    each: true,
    message: i18nValidationMessage('common.validation.Min'),
  })
  @Max(6, {
    each: true,
    message: i18nValidationMessage('common.validation.Max'),
  })
  daysOfWeek: number[];
}
