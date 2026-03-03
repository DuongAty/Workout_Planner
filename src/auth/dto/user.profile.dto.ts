import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEmpty,
  IsEnum,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';
import { Gender, UserGoal } from '../../common/enum/user-enum';
import { Transform } from 'class-transformer';
import { trim } from 'src/common/constants/constants';

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
  @Length(8, 20)
  @Transform(trim)
  @IsOptional()
  fullname?: string;

  @ApiProperty({ description: 'Email' })
  @IsEmail()
  @IsOptional()
  @Transform(trim)
  email?: string;

  @ApiProperty({ description: 'Avatar' })
  avatar?: string;

  @ApiProperty({ description: 'Weight' })
  @IsOptional()
  @Min(10)
  @Max(200)
  weight?: number;

  @ApiProperty({ description: 'Height' })
  @IsOptional()
  @Min(50)
  @Max(250)
  height?: number;

  @ApiProperty({ description: 'Age' })
  @IsOptional()
  @Min(10)
  @Max(100)
  age?: number;

  @ApiProperty({ description: 'Gender' })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiProperty({ description: 'Goal' })
  @IsOptional()
  @IsEnum(UserGoal)
  goal?: UserGoal;
}
