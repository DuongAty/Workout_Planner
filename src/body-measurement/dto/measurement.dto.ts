import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { MuscleGroup } from 'src/exercise/exercise-musclegroup';

export class CreateMeasurementDto {
  @ApiProperty({ enum: MuscleGroup })
  @IsEnum(MuscleGroup)
  key: MuscleGroup;

  @IsNumber()
  @ApiProperty()
  value: number;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  unit?: string;
}

export class GetMeasurementsQueryDto {
  @IsOptional()
  @ApiProperty({ enum: MuscleGroup, required: false })
  @IsEnum(MuscleGroup)
  key?: MuscleGroup;
}
