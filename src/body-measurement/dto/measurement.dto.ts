import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { MuscleGroup } from '../exercise/exercise-musclegroup';

export enum UnitType {
  cm = 'cm',
  kg = 'kg',
}
export class CreateMeasurementDto {
  @ApiProperty({ enum: MuscleGroup })
  @IsEnum(MuscleGroup)
  key: MuscleGroup;

  @IsNumber()
  @ApiProperty()
  value: number;

  @ApiProperty({ enum: UnitType })
  @IsEnum(UnitType)
  unit?: UnitType.cm;
}

export class GetMeasurementsQueryDto {
  @IsOptional()
  @ApiProperty({ enum: MuscleGroup, required: false })
  @IsEnum(MuscleGroup)
  key?: MuscleGroup;

  @IsOptional()
  @ApiProperty({ required: false })
  startDate?: string;

  @IsOptional()
  @ApiProperty({ required: false })
  endDate?: string;
}
