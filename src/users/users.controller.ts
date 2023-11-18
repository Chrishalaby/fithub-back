import { Body, Controller, Get, InternalServerErrorException, Post, UseGuards } from '@nestjs/common';
import { User } from 'entities/users.entity';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { UsersService } from './users.service';
import {  CrudController } from '@nestjsx/crud';
import { ApiTags } from '@nestjs/swagger';
import { CreateUserDto } from 'src/auth/dto/create-user.dto';

@ApiTags('Users')
// @UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController implements CrudController<User> {
  constructor(public readonly service: UsersService) {}

  @Get()
  async findAll(): Promise<User[]> {
    console.log('GET request received for all users');
    try {
      return await this.service.find();
    } catch (error) {
      console.error('Error in GET /users:', error);
      throw new InternalServerErrorException();
    }
  }

  @Post('add_user')
  createUser(@Body() user: CreateUserDto): Promise<User>{
    return this.service.createOne(user);
  }
 }
