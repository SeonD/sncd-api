import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToMany, JoinTable } from 'typeorm';
import { Deck } from './deck';
import { Team } from './team';

@Entity()
export class User {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column()
    username: string;

    @Column()
    password: string;

    @Column({ nullable: true })
    accessToken: string;

    @OneToMany(() => Deck, deck => deck.owner)
    decks: Deck[];

    // Teams that the user "owns"
    @OneToMany(() => Team, team => team.owner)
    teamsOwned: Team[];

    // Teams the user "belongs to"
    @ManyToMany(() => Team, team => team.members)
    teams: Team[];
}
