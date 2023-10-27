import { IsString, Matches } from 'class-validator';

export class ResetCredentialsDto {
  @IsString()
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'Please enter a strong password !',
  })
  public password: string;
}
