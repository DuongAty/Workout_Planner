import { Transform, Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { MAX_LENGHT, trim } from 'src/constants/constants';

export class UpsertStepDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsNotEmpty()
  @IsNumber()
  order: number;

  @MaxLength(MAX_LENGHT)
  @IsNotEmpty()
  @Transform(trim)
  description: string;
}

export class SaveStepsDto {
  @ValidateNested({ each: true })
  @Type(() => UpsertStepDto)
  steps: UpsertStepDto[];
}
