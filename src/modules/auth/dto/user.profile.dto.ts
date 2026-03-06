import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { trim } from 'src/constants/constants';
import { Gender, UserGoal } from 'src/enums/user-enum';
import { i18nValidationMessage } from 'nestjs-i18n';

export class UserProfileDto {
  @ApiProperty()
  fullname: string;

  @ApiProperty()
  username: string;
}

export class VerifyCodeDto {
  @IsString() code: string;
}

export class UpdateUserProfileDto {
  @ApiProperty({ description: 'Full Name' })
  @IsString()
  @MinLength(8, {
    message: i18nValidationMessage('common.validation.MinLength'),
  })
  @MaxLength(20, {
    message: i18nValidationMessage('common.validation.MaxLength'),
  })
  @Transform(trim)
  @IsOptional()
  fullname?: string;

  @ApiProperty({ description: 'Email' })
  @IsEmail({}, { message: i18nValidationMessage('common.validation.IsEmail') })
  @IsOptional()
  @Transform(trim)
  email?: string;

  @ApiProperty({ description: 'Avatar' })
  avatar?: string;

  @ApiProperty({ description: 'Weight' })
  @IsOptional()
  @Min(10, { message: i18nValidationMessage('common.validation.Min') })
  @Max(200, { message: i18nValidationMessage('common.validation.Max') })
  weight?: number;

  @ApiProperty({ description: 'Height' })
  @IsOptional()
  @Min(50, { message: i18nValidationMessage('common.validation.Min') })
  @Max(250, { message: i18nValidationMessage('common.validation.Max') })
  height?: number;

  @ApiProperty({ description: 'Age' })
  @IsOptional()
  @Min(10, { message: i18nValidationMessage('common.validation.Min') })
  @Max(100, { message: i18nValidationMessage('common.validation.Max') })
  age?: number;

  @ApiProperty({ description: 'Gender' })
  @IsOptional()
  @IsEnum(Gender, {
    message: i18nValidationMessage('common.validation.IsEnum'),
  })
  gender?: Gender;

  @ApiProperty({ description: 'Goal' })
  @IsOptional()
  @IsEnum(UserGoal, {
    message: i18nValidationMessage('common.validation.IsEnum'),
  })
  goal?: UserGoal;
}

export class UpdateTokenDto {
  @ApiProperty({ description: 'Token' })
  @IsString()
  @IsOptional()
  fcmToken?: string;
}
