import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';

import { User } from './user.entity';

@Entity('auth_sessions')
export class AuthSession {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({
        type: 'uuid',
        unique: true,
    })
    user_id: string;

    @Column({
        type: 'text',
    })
    refresh_token_hash: string;

    @Column({
        type: 'varchar',
        length: 255,
        nullable: true,
    })
    device_id: string | null;

    @Column({
        type: 'varchar',
        length: 255,
        nullable: true,
    })
    device_name: string | null;

    @Column({
        type: 'varchar',
        length: 100,
        nullable: true,
    })
    ip_address: string | null;

    @Column({
        type: 'text',
        nullable: true,
    })
    user_agent: string | null;

    @Column({
        type: 'timestamptz',
    })
    expires_at: Date;

    @Column({
        type: 'timestamptz',
        nullable: true,
    })
    revoked_at: Date | null;

    @CreateDateColumn({
        type: 'timestamptz',
    })
    created_at: Date;

    @UpdateDateColumn({
        type: 'timestamptz',
    })
    updated_at: Date;

    @ManyToOne(() => User, (user) => user.auth_sessions)
    @JoinColumn({ name: 'user_id' })
    user: User;
}