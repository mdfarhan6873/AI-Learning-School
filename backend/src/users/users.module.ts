import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UserProfile } from './entities/user-profile.entity';
import { Role } from './entities/role.entity';
import { UserRole } from './entities/user-role.entity';
import { AuthSession } from './entities/auth-session.entity';
import { UsersService } from './users.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            User,
            UserProfile,
            Role,
            UserRole,
            AuthSession,
        ]),
    ],
    providers: [UsersService],
    exports: [TypeOrmModule, UsersService],
})
export class UsersModule {}
