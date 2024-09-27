import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, ManyToMany, JoinTable } from 'typeorm';
import { User } from './user';

@Entity()
export class Team {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column()
    name: string;

    @Column()
    description: string;

    @ManyToOne(() => User, user => user.teamsOwned)
    owner: User;

    @ManyToMany(() => User, user => user.teams)
    @JoinTable()
    members: User[];
}
