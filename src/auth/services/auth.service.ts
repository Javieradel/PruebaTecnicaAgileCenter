
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from 'src/users/services/users.service';
import { LoginDto } from '../dto/login.dto';
import { User } from 'src/users/schemas/users.schema';

@Injectable()
export class AuthService {
  constructor(private usersService: UsersService, private readonly jwtService: JwtService) {}

  async signIn(loginDto: LoginDto): Promise<any> {
    const {email, password} = loginDto
    const user = (await this.usersService.findByEmail(email)).toObject();
    if(!user) throw new UnauthorizedException();
    
    const match = await bcrypt.compare(password, user.password);
    
    if(!match) {
      throw new UnauthorizedException();
    }
    
    delete user.password
    
    return this.jwtService.sign({...user, sub: user._id });
  }

  async validateUser(payload: LoginDto): Promise<User | null>{
    return this.usersService.validateUser(payload.email, payload.password)
  }
}