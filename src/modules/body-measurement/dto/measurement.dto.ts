import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, Max, Min } from 'class-validator';
import { MuscleGroup } from '../../exercise/exercise-musclegroup';
import { i18nValidationMessage } from 'nestjs-i18n';

export enum UnitType {
  cm = 'cm',
  kg = 'kg',
}
export class CreateMeasurementDto {
  @ApiProperty({ enum: MuscleGroup })
  @IsEnum(MuscleGroup, {
    message: i18nValidationMessage('common.validation.IsEnum'),
  })
  key: MuscleGroup;

  @IsNumber()
  @ApiProperty()
  @Min(20, { message: i18nValidationMessage('common.validation.Min') })
  @Max(200, { message: i18nValidationMessage('common.validation.Max') })
  value: number;

  @ApiProperty({ enum: UnitType })
  @IsEnum(UnitType, {
    message: i18nValidationMessage('common.validation.IsEnum'),
  })
  unit?: UnitType = UnitType.cm;
}

export class GetMeasurementsQueryDto {
  @IsOptional()
  @ApiProperty({ enum: MuscleGroup, required: false })
  @IsEnum(MuscleGroup, {
    message: i18nValidationMessage('common.validation.IsEnum'),
  })
  key?: MuscleGroup;

  @IsOptional()
  @ApiProperty({ required: false })
  startDate?: string;

  @IsOptional()
  @ApiProperty({ required: false })
  endDate?: string;
}
