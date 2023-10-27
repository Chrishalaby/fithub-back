import { IsString } from 'class-validator';

export class EmailDto {
  @IsString()
  public email: string;
}
