'use strict';

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Permissioned } from './permissioned/base';
import { User } from './user';

@Entity()
export class Deck extends Permissioned {

    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column()
    strmId: string;

    // TODO: Update to the correct name (strmActionKey)
    @Column()
    strmPatchKey: string;

    @ManyToOne(() => User, user => user.decks)
    owner: User;

    @Column("text", { array: true })
    slides: string[];

    @Column()
    currentSlide: number;

    // We don't have the object hierarchy just yet.
    // @ManyToOne(() => DeckList, deckList => deckList.decks)
    // parent: DeckList;
}
