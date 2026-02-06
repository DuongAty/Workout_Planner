import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';
import { Gender, UserGoal } from 'src/common/enum/user-enum';

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
  fullname?: string;

  @ApiProperty({ description: 'User Name' })
  username?: string;

  @ApiProperty({ description: 'Email' })
  email?: string;

  @ApiProperty({ description: 'Avatar' })
  avatar?: string;

  @ApiProperty({ description: 'Weight' })
  weight?: number;

  @ApiProperty({ description: 'Height' })
  height?: number;

  @ApiProperty({ description: 'Age' })
  age?: number;

  @ApiProperty({ description: 'Gender' })
  @IsEnum(Gender)
  gender?: Gender;

  @ApiProperty({ description: 'Goal' })
  @IsEnum(UserGoal)
  goal?: UserGoal;
}
