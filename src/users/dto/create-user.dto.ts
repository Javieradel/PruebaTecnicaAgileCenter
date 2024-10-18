import { IsEmail, IsEnum, IsNotEmpty, MinLength } from 'class-validator';
import { UserRole, UserStatus } from '../schemas/users.schema';
import { Optional } from '@nestjs/common';

export class CreateUserDto {
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsEnum(UserRole)
  role: UserRole;

  @IsEnum(UserStatus)
  status: UserStatus;
}
