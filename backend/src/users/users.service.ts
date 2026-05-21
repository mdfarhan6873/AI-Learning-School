import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UserProfile } from './entities/user-profile.entity';
import { Role } from './entities/role.entity';
import { UserRole } from './entities/user-role.entity';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(UserProfile)
        private readonly userProfileRepository: Repository<UserProfile>,
        @InjectRepository(Role)
        private readonly roleRepository: Repository<Role>,
        @InjectRepository(UserRole)
        private readonly userRoleRepository: Repository<UserRole>,
    ) {}

    async findByMobile(mobile: string): Promise<User | null> {
        return this.userRepository.findOne({ where: { mobile } });
    }

    async findByEmail(email: string): Promise<User | null> {
        return this.userRepository.findOne({ where: { email } });
    }

    async createStudentUser(identifier: string, isEmail: boolean = false): Promise<User> {
        // Create base user
        const user = this.userRepository.create({
            mobile: !isEmail ? identifier : null,
            email: isEmail ? identifier : null,
            mobile_verified: !isEmail,
            email_verified: isEmail,
            auth_provider: isEmail ? 'email_otp' : 'phone_otp',
            is_active: true,
            is_profile_completed: false,
        });

        const savedUser = await this.userRepository.save(user);

        // Auto create profile
        const profile = this.userProfileRepository.create({
            user_id: savedUser.id,
        });
        await this.userProfileRepository.save(profile);

        // Assign student role if exists
        const studentRole = await this.roleRepository.findOne({ where: { code: 'student' } });
        if (studentRole) {
            const userRole = this.userRoleRepository.create({
                user_id: savedUser.id,
                role_id: studentRole.id,
                is_active: true,
            });
            await this.userRoleRepository.save(userRole);
        }

        return savedUser;
    }

    async updateLastLogin(userId: string): Promise<void> {
        await this.userRepository.update(userId, { last_login_at: new Date() });
    }
}
