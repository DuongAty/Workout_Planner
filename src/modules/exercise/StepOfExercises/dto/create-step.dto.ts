import { Transform, Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { MAX_LENGHT, trim } from 'src/constants/constants';

export class UpsertStepDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsNotEmpty()
  @IsNumber(
    {},
    { message: i18nValidationMessage('common.validation.IsNumber') },
  )
  order: number;

  @MaxLength(MAX_LENGHT, {
    message: i18nValidationMessage('common.validation.MaxLength'),
  })
  @IsNotEmpty()
  @Transform(trim)
  description: string;
}

export class SaveStepsDto {
  @ValidateNested({ each: true })
  @Type(() => UpsertStepDto)
  steps: UpsertStepDto[];
}
