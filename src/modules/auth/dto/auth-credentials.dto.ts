import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, MaxLength, MinLength } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import {
  MAX_LENGHT_USER,
  MIN_LENGHT_USER,
  trim,
} from 'src/constants/constants';

export class AuthCredentialsDto {
  @IsString()
  @Transform(trim)
  @MinLength(MIN_LENGHT_USER, {
    message: i18nValidationMessage('common.validation.MinLength'),
  })
  @MaxLength(MAX_LENGHT_USER, {
    message: i18nValidationMessage('common.validation.MaxLength'),
  })
  @ApiProperty({
    description: 'User Name',
  })
  username: string;

  @IsString()
  @Transform(trim)
  @MinLength(MIN_LENGHT_USER, {
    message: i18nValidationMessage('common.validation.MinLength'),
  })
  @MaxLength(MAX_LENGHT_USER, {
    message: i18nValidationMessage('common.validation.MaxLength'),
  })
  @ApiProperty({
    description: 'Password',
  })
  password: string;
}
