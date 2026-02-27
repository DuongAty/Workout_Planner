import {
  IsString,
  IsArray,
  IsOptional,
  IsNotEmpty,
  IsNumber,
} from 'class-validator';

export class CloneScheduleDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsNotEmpty()
  @IsOptional()
  @IsString()
  startDate: string;

  @IsNotEmpty()
  @IsString()
  @IsOptional()
  endDate: string;

  @IsNotEmpty()
  @IsOptional()
  @IsNumber()
  estimatedCalories: number;

  @IsArray()
  @IsOptional()
  @IsNumber({}, { each: true })
  daysOfWeek: number[];
}
