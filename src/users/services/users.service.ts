import { Injectable, ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { User, UserRole, UserStatus } from '../schemas/users.schema';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private readonly eventEmitter: EventEmitter2
  ) {}

  async create(createUserDto: CreateUserDto, author: User): Promise<User> {
    const existingUser = await this.userModel.findOne({ email: createUserDto.email });
    if(author.role !== UserRole.ADMIN) throw new ForbiddenException('Only admins can create users')
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const newUser = new this.userModel({
      ...createUserDto,
      password: hashedPassword,
      createdBy: new Types.ObjectId(author.id)
    });

    const result = await this.userModel.create(newUser)
    this.eventEmitter.emit('user.created', result)
    return result
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find().exec();
  }

  async findByEmail(email: string): Promise<User | null>{
    const user = await this.userModel.findOne({email}).select('+password').exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    return user;
  }

  async verifyUser(id, payload){
    const user = await this.userModel.findById(id).exec();
    if (!user) throw new NotFoundException('User not found');

    if(payload.role != user.role) throw new NotFoundException('User not found');

    if(payload.email != user.email) throw new NotFoundException('User not found');
    if(payload.status != user.status) throw new NotFoundException('User not found');
    if(user.status != UserStatus.ACTIVE) throw new NotFoundException('User not found')
    
    return user;
  }

  async findById(id: string): Promise<User> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    return user;
  }

  /**
  * In databases with denormalization,
  * update operations can cause information discrepancies,
  *  making it a heavy task to maintain data parity.
  */
  async update(id: string, updateUserDto: UpdateUserDto, author: User): Promise<User> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if(!this.canEditUser(user, author)) throw new ForbiddenException('can edit this edit user data')


    Object.assign(user, updateUserDto);
    const result = await this.userModel.findByIdAndUpdate(user.id, updateUserDto)

    this.eventEmitter.emit('user.updated', result)
    // TODO: Add an event handler, push the operation to the queue, and remove the user with side effects.

    return result
  }

  /**
  * The operation of deleting users may require additional significant load actions.
  * For this reason, handling user deletion in an asynchronous and careful manner,
  * subject to rollbacks, is a good option.
  */
  async delete(id: string, author: User): Promise<User> {
    const user = (await this.userModel.findById(id).exec()).toObject();
    
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    
    if(!this.canEditUser(user, author)) throw new ForbiddenException('can edit this edit user data')
    const result = await this.userModel.findByIdAndUpdate(id, {status: UserStatus.PENDING_REMOVE})
    
    this.eventEmitter.emit('user.removed', result)
    // TODO: Add an event handler, push the operation to the queue, and remove the user with side effects.

    return result
  }

  async validateUser(email: string, pass: string): Promise<User> {
    const user = await this.userModel.findOne({email}).select('+password').exec();
    if (!user) return null;
    if(user.password !== pass) return null;
    
    return user;
  }

  canEditUser(user: User, author: User){
    const isOwner = user.email == author.email
    const isUserAdmin = user.role == UserRole.ADMIN
    const isAdmin = author.role == UserRole.ADMIN

    if(isUserAdmin && !isOwner) return false
    if(!isAdmin && !isOwner) return false

    return true
  }

}
