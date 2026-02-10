import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsString, Length, Max, Min } from 'class-validator';
import { Gender, UserGoal } from '../common/enum/user-enum';

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
  fullname?: string;

  @ApiProperty({ description: 'User Name' })
  @IsString()
  @Length(8, 20)
  username?: string;

  @ApiProperty({ description: 'Email' })
  @IsEmail()
  email?: string;

  @ApiProperty({ description: 'Avatar' })
  avatar?: string;

  @ApiProperty({ description: 'Weight' })
  @Min(10)
  @Max(200)
  weight?: number;

  @ApiProperty({ description: 'Height' })
  @Min(50)
  @Max(250)
  height?: number;

  @ApiProperty({ description: 'Age' })
  @Min(10)
  @Max(100)
  age?: number;

  @ApiProperty({ description: 'Gender' })
  @IsEnum(Gender)
  gender?: Gender;

  @ApiProperty({ description: 'Goal' })
  @IsEnum(UserGoal)
  goal?: UserGoal;
}
