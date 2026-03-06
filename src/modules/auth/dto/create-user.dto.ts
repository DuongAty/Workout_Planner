import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import {
  MAX_LENGHT_USER,
  MIN_LENGHT_USER,
  passwordVal,
  trim,
} from 'src/constants/constants';

export class CreateUserDto {
  @ApiProperty({ description: 'Email' })
  @IsEmail({}, { message: i18nValidationMessage('common.validation.IsEmail') })
  @Transform(trim)
  email: string;

  @IsString()
  @Transform(trim)
  @MinLength(MIN_LENGHT_USER, {
    message: i18nValidationMessage('common.validation.MinLength')})
  @MaxLength(MAX_LENGHT_USER, {
    message: i18nValidationMessage('common.validation.MaxLength')})
  @ApiProperty({
    description: 'Full Name',
  })
  fullname: string;

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
  @Matches(passwordVal, {
    message: i18nValidationMessage('common.validation.Password'),
  })
  @ApiProperty({
    description: 'Password',
  })
  password: string;
}
