import { ApiProperty } from '@nestjs/swagger';

export class UserProfileDto {
  @ApiProperty()
  fullname: string;

  @ApiProperty()
  username: string;
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
}
