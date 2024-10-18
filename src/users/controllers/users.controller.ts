import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards, Req } from '@nestjs/common';
import { UsersService } from '../services/users.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { User, UserRole } from '../schemas/users.schema';
import { Request } from 'express';
import { UpdateUserDto } from '../dto/update-user.dto';

@UseGuards(AuthGuard('jwt'),RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  getUsers() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN,UserRole.USER)
  getUserById(@Param('id') id: string, @Req() request: Request) {
    const user = request.user;
    return this.usersService.findById(id);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  createUser(@Body() createUserDto: CreateUserDto,@Req() request: Request) {
    const user = request.user as User;
    return this.usersService.create(createUserDto, user);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.USER)
  updateUser(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto, @Req() request: Request) {
    const user = request.user as User;
    return this.usersService.update(id, updateUserDto, user);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN,UserRole.USER)
  deleteUser(@Param('id') id: string, @Req() request: Request) {
    const user = request.user;
    return this.usersService.delete(id, user as User);
  }
}
