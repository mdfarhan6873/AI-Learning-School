import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    OneToMany,
} from 'typeorm';

import { UserRole } from './user-role.entity';

@Entity('roles')
export class Role {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({
        type: 'varchar',
        length: 50,
        unique: true,
    })
    code: string;

    @Column({
        type: 'varchar',
        length: 100,
    })
    display_name: string;

    @Column({
        type: 'text',
        nullable: true,
    })
    description: string | null;

    @Column({
        default: true,
    })
    is_active: boolean;

    @CreateDateColumn({
        type: 'timestamptz',
    })
    created_at: Date;

    @OneToMany(() => UserRole, (userRole) => userRole.role)
    user_roles: UserRole[];
}