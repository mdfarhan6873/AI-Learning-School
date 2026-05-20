import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';

import { User } from './user.entity';

export type Gender = 'male' | 'female' | 'other';

@Entity('user_profiles')
export class UserProfile {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({
        type: 'uuid',
        unique: true,
    })
    user_id: string;

    @Column({
        type: 'text',
        nullable: true,
    })
    profile_image: string | null;

    @Column({
        type: 'date',
        nullable: true,
    })
    date_of_birth: Date | null;

    @Column({
        type: 'varchar',
        length: 20,
        nullable: true,
    })
    gender: Gender | null;

    @Column({
        type: 'text',
        nullable: true,
    })
    address_line1: string | null;

    @Column({
        type: 'text',
        nullable: true,
    })
    address_line2: string | null;

    @Column({
        type: 'varchar',
        length: 100,
        nullable: true,
    })
    city: string | null;

    @Column({
        type: 'varchar',
        length: 100,
        nullable: true,
    })
    state: string | null;

    @Column({
        type: 'varchar',
        length: 100,
        nullable: true,
    })
    country: string | null;

    @Column({
        type: 'varchar',
        length: 20,
        nullable: true,
    })
    postal_code: string | null;

    @Column({
        type: 'varchar',
        length: 150,
        nullable: true,
    })
    emergency_contact_name: string | null;

    @Column({
        type: 'varchar',
        length: 20,
        nullable: true,
    })
    emergency_contact_mobile: string | null;

    @Column({
        type: 'text',
        nullable: true,
    })
    bio: string | null;

    @CreateDateColumn({
        type: 'timestamptz',
    })
    created_at: Date;

    @UpdateDateColumn({
        type: 'timestamptz',
    })
    updated_at: Date;

    @OneToOne(() => User, (user) => user.profile)
    @JoinColumn({ name: 'user_id' })
    user: User;
}