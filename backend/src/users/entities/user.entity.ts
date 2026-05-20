import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    OneToOne,
    OneToMany,
} from 'typeorm';

import { UserProfile } from './user-profile.entity';
import { UserRole } from './user-role.entity';
import { AuthSession } from './auth-session.entity';

export type AuthProvider =
    | 'phone_otp'
    | 'email_otp'
    | 'google'
    | 'apple'
    | 'password';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({
        type: 'varchar',
        length: 150,
        nullable: true,
    })
    full_name: string | null;

    @Column({
        type: 'varchar',
        length: 255,
        unique: true,
        nullable: true,
    })
    email: string | null;

    @Column({
        type: 'varchar',
        length: 20,
        unique: true,
        nullable: true,
    })
    mobile: string | null;

    @Column({
        default: false,
    })
    email_verified: boolean;

    @Column({
        default: false,
    })
    mobile_verified: boolean;

    @Column({
        type: 'varchar',
        length: 30,
        default: 'phone_otp',
    })
    auth_provider: AuthProvider;

    @Column({
        type: 'varchar',
        length: 255,
        nullable: true,
    })
    provider_user_id: string | null;

    @Column({
        default: true,
    })
    is_active: boolean;

    @Column({
        default: false,
    })
    is_profile_completed: boolean;

    @Column({
        type: 'timestamptz',
        nullable: true,
    })
    last_login_at: Date | null;

    @CreateDateColumn({
        type: 'timestamptz',
    })
    created_at: Date;

    @UpdateDateColumn({
        type: 'timestamptz',
    })
    updated_at: Date;

    @DeleteDateColumn({
        type: 'timestamptz',
        nullable: true,
    })
    deleted_at: Date | null;

    @OneToOne(() => UserProfile, (profile) => profile.user)
    profile: UserProfile;

    @OneToMany(() => UserRole, (userRole) => userRole.user)
    user_roles: UserRole[];

    @OneToMany(() => AuthSession, (session) => session.user)
    auth_sessions: AuthSession[];
}