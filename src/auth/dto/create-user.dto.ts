import { ApiProperty } from '@nestjsx/crud/lib/crud';
import { IsInt, IsString, isNotEmpty } from 'class-validator';

export class CreateUserDto {
  @ApiProperty()
  @IsString()
  public username: string;

  @ApiProperty()
  @IsString()
  public email: string;

  @ApiProperty()
  @IsString()
  public password: string;

  @ApiProperty()
  @IsInt()
  public userTypeId: number;

}
