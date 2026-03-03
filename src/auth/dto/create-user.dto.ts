import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';
import {
  MAX_LENGHT_USER,
  MIN_LENGHT_USER,
  passwordVal,
  trim,
} from 'src/common/constants/constants';

export class CreateUserDto {
  @IsString()
  @Transform(trim)
  @MinLength(MIN_LENGHT_USER)
  @MaxLength(MAX_LENGHT_USER)
  @ApiProperty({
    description: 'Full Name',
  })
  fullname: string;

  @IsString()
  @Transform(trim)
  @MinLength(MIN_LENGHT_USER)
  @MaxLength(MAX_LENGHT_USER)
  @ApiProperty({
    description: 'User Name',
  })
  username: string;

  @IsString()
  @Transform(trim)
  @MinLength(MIN_LENGHT_USER)
  @MaxLength(MAX_LENGHT_USER)
  @Matches(passwordVal, {
    message:
      'The password is too weak: It needs to include uppercase letters, lowercase letters, and numbers/special characters.',
  })
  @ApiProperty({
    description: 'Password',
  })
  password: string;
}
