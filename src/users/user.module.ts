import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { UserSchema, User } from './schemas/users.schema';
import { UsersController } from './controllers/users.controller';
import { UsersService } from './services/users.service';
import { JwtModule } from '@nestjs/jwt';


@Module({
    imports: [
        MongooseModule.forFeature([{name: User.name, schema: UserSchema }]),
        JwtModule,
        EventEmitterModule.forRoot()
    ],
    providers: [
        UsersService,
        JwtModule,
    ],
    exports: [UsersService],
    controllers: [UsersController]
})
export class UsersModule {}
