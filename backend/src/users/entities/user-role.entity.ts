import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
} from 'typeorm';

import { User } from './user.entity';
import { Role } from './role.entity';

@Entity('user_roles')
export class UserRole {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({
        type: 'uuid',
    })
    user_id: string;

    @Column({
        type: 'uuid',
    })
    role_id: string;

    @Column({
        type: 'uuid',
        nullable: true,
    })
    assigned_by: string | null;

    @Column({
        default: true,
    })
    is_active: boolean;

    @CreateDateColumn({
        type: 'timestamptz',
    })
    assigned_at: Date;

    @Column({
        type: 'timestamptz',
        nullable: true,
    })
    revoked_at: Date | null;

    @ManyToOne(() => User, (user) => user.user_roles)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @ManyToOne(() => Role, (role) => role.user_roles)
    @JoinColumn({ name: 'role_id' })
    role: Role;

    @ManyToOne(() => User, {
        nullable: true,
    })
    @JoinColumn({ name: 'assigned_by' })
    assigned_by_user: User | null;
}