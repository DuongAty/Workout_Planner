import { ApiProperty } from '@nestjs/swagger';

export class UserProfileDto {
  @ApiProperty()
  fullname: string;

  @ApiProperty()
  username: string;
}
