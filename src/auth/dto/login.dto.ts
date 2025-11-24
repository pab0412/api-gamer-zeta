import { IsEmail, IsString, MinLength } from 'class-validator';
import {Transform} from 'class-transformer';
export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  @Transform(({ value }) => {
    return value?.trim();
  })
  password: string;
}