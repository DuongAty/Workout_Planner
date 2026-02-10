import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayUnique,
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Max,
  Min,
} from 'class-validator';
import { WorkoutStatus } from '../workout-status';
import { Transform } from 'class-transformer';

export class UpdateWorkoutDto {
  @IsNotEmpty()
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
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
  @IsArray()
  @ArrayUnique()
  @Min(0, { each: true })
  @Max(6, { each: true })
  @IsNumber({}, { each: true })
  daysOfWeek?: number[];
}

export class UpdateStatusDto {
  @ApiProperty()
  @IsEnum(WorkoutStatus)
  status: WorkoutStatus;
}

export class UpdateScheduleDto {
  @ApiProperty({ example: '2026-02-20' })
  @IsOptional()
  @IsDateString()
  oldDate?: string;

  @ApiProperty({ example: '2026-02-20' })
  @IsOptional()
  @IsDateString()
  newDate?: string;
}

export class UpdateDaysOfWeekDto {
  @ApiProperty({
    example: [0, 2, 4, 6],
    description: 'The days of the week (0: CN, 1: T2...)',
  })
  @IsArray()
  @IsNumber({}, { each: true })
  daysOfWeek: number[];
}
