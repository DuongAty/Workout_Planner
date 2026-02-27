import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, MaxLength, MinLength } from 'class-validator';
import {
  MAX_LENGHT_USER,
  MIN_LENGHT_USER,
  trim,
} from 'src/constants/constants';

export class AuthCredentialsDto {
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
  @ApiProperty({
    description: 'Password',
  })
  password: string;
}
