'use strict';

import { connection } from '../database';
import { Team as Entity } from './entity/team';
import { User, getOneById as getUserById } from './user';

export class Team {
  id: string;
  name: string;
  description: string;
  owner: User;
  members: User[];
  dbObject: Entity;

  constructor(dbObject?: Entity) {
    if (dbObject) {
      this.setPropertiesFromDbObject(dbObject);
    } else {
      this.dbObject = new Entity();
    }
  }

  async init(userId, payload) {
    await this.setPropertiesFromPayload(userId, payload);
  }

  setPropertiesFromDbObject(dbObject: Entity) {
    this.dbObject = dbObject;
    this.id = dbObject.id;
    if (dbObject.name) {
      this.name = dbObject.name;
    }
    if (dbObject.description) {
      this.description = dbObject.description;
    }
    if (dbObject.owner) {
      this.owner = new User(dbObject.owner);
    }
    if (dbObject.members) {
      this.members = dbObject.members.map(dbUserObject => new User(dbUserObject));
    }
  }

  async setPropertiesFromPayload(userId: string, payload: any) {
    const owner = await getUserById(userId);
    
    this.owner = owner;
    this.name = payload.name;
    this.description = payload.description;
  }

  async save(): Promise<Entity> {
    const conn = await connection;
    if (!conn) {
      return null;
    }

    this.dbObject.name = this.name;
    this.dbObject.description = this.description;
    this.dbObject.owner = this.owner.dbObject;
    if (this.members) {
      this.dbObject.members = this.members.map(user => user.dbObject);
    }
    return await conn.manager.save(this.dbObject);
  }

  async delete(): Promise<void> {
    const conn = await connection;
    if (!conn) {
      // Error: connection not found
      return;
    }

    try {
      await conn.manager.remove(this.dbObject);
    } catch (ex) {
      console.log(`Error deleting a team ${this.id}`);
    }
  }

  addNewMember(newMember: User): void {
    if (!this.members) {
      this.members = [];
    }

    for (let i = 0; i < this.members.length; i++) {
      if (this.members[i].id === newMember.id) {
        // The user is already included in the team
        return;
      }
    }

    this.members.push(newMember);
  }
}

export async function getOneById(teamId: string): Promise<Team> {
  const conn = await connection;
  if (!conn) {
    return null;
  }

  const dbObject = await conn.manager.findOne(Entity, teamId, {
    relations: ['owner', "members"]
  });
  if (!dbObject) {
    return null;
  }

  let obj = new Team();
  obj.setPropertiesFromDbObject(dbObject);
  return obj;
}
