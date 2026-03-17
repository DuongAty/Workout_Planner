import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import {
  MAX_LENGHT_USER,
  MIN_LENGHT_USER,
  passwordRegex,
  trim,
} from 'src/constants/constants';

export class ChangePasswordDto {
  @ApiProperty({
    description: 'Current Password',
  })
  @IsString()
  @IsOptional()
  @Transform(trim)
  @IsNotEmpty({ message: 'New Password is not empty' })
  @MinLength(MIN_LENGHT_USER, {
    message: i18nValidationMessage('common.validation.MinLength'),
  })
  @MaxLength(MAX_LENGHT_USER, {
    message: i18nValidationMessage('common.validation.MaxLength'),
  })
  @Matches(passwordRegex, {
    message: i18nValidationMessage('common.validation.Password'),
  })
  currentPassword: string;

  @IsString()
  @IsNotEmpty({ message: 'New Password is not empty' })
  @Transform(trim)
  @MinLength(MIN_LENGHT_USER, {
    message: i18nValidationMessage('common.validation.MinLength'),
  })
  @MaxLength(MAX_LENGHT_USER, {
    message: i18nValidationMessage('common.validation.MaxLength'),
  })
  @Matches(passwordRegex, {
    message: i18nValidationMessage('common.validation.Password'),
  })
  @ApiProperty({
    description: 'New Password',
  })
  newPassword: string;
}

export class ForgotPasswordDto {
  @ApiProperty({
    description: 'Email',
  })
  @IsEmail()
  @Transform(trim)
  email: string;
}

export class ResetPasswordDto {
  @IsNotEmpty({ message: 'Token là bắt buộc' })
  @IsString()
  token: string;

  @IsNotEmpty({ message: 'New Password is not empty' })
  @IsString()
  @Transform(trim)
  @MinLength(MIN_LENGHT_USER, {
    message: i18nValidationMessage('common.validation.MinLength'),
  })
  @MaxLength(MAX_LENGHT_USER, {
    message: i18nValidationMessage('common.validation.MaxLength'),
  })
  @Matches(passwordRegex, {
    message: i18nValidationMessage('common.validation.Password'),
  })
  @ApiProperty({
    description: 'New Password',
  })
  newPassword: string;
}
