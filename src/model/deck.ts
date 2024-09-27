'use strict'

import { Connection } from 'typeorm'
import axios from 'axios';

import { STRM_API_URL } from '../common/config';
import { getStrmToken } from '../common/strm';
import { isAllowedToUser } from '../common/access';

import { connection } from '../database';
import { Deck as Entity } from './entity/deck';
import { User, getOneById as getUserById } from './user';
import { getOneById as getTeamById } from './team';
import { Permission, Permissioned, Access } from './entity/permissioned/base';

const DEFAULT_SLIDES = [];
const DEFAULT_CURRENT_SLIDE = 0;

export class Deck {
  id: string;
  strmId: string;
  strmPatchKey: string;
  owner: User;
  slides: string[];
  currentSlide: number;
  permission: Permission;
  parent: any; // Will be "DeckList" eventually
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
    
    const strmToken = await getStrmToken();
    try {
      const strmDocRes = await axios.post(`${STRM_API_URL}/api/v1/docs`, {
        description: `Sncd Deck`,
        document: {
          slides: this.slides,
          currentSlide: this.currentSlide
        }
      }, {
        headers: {
          'Authorization': `Bearer ${strmToken}`
        }
      });
  
      const strmData = strmDocRes.data;
      console.log(`Strm doc created with id ${strmData.doc._id}`);
      
      this.strmId = strmData.doc._id;
      this.strmPatchKey = strmData.patch_key;
    } catch (ex) {
      throw Error(ex);
    }
  }

  setPropertiesFromDbObject(dbObject: Entity) {
    this.dbObject = dbObject;
    this.id = dbObject.id;
    if (dbObject.owner) {
      this.owner = new User(dbObject.owner);
    }
    if (dbObject.strmId) {
      this.strmId = dbObject.strmId;
    }
    if (dbObject.strmPatchKey) {
      this.strmPatchKey = dbObject.strmPatchKey;
    }
    if (dbObject.slides) {
      this.slides = dbObject.slides;
    }
    if (dbObject.currentSlide !== undefined) {
      this.currentSlide = dbObject.currentSlide;
    }
    if (dbObject.permission) {
      this.permission = dbObject.permission;
    }
  }

  async setPropertiesFromPayload(userId: string, payload: any) {
    const owner = await getUserById(payload.owner);

    this.owner = owner;
    this.slides = payload.slides ? payload.slides : DEFAULT_SLIDES;
    this.currentSlide = payload.currentSlide || DEFAULT_CURRENT_SLIDE;
  }

  save(): Promise<Object> {
    return connection.then((conn: Connection) => {
      this.dbObject.owner = this.owner.dbObject;
      this.dbObject.strmId = this.strmId;
      this.dbObject.strmPatchKey = this.strmPatchKey;
      this.dbObject.slides = this.slides;
      this.dbObject.currentSlide = this.currentSlide;
      this.dbObject.permission = this.permission;
      return conn.manager.save(this.dbObject);
    });
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
      console.log(`Error deleting a deck ${this.id}`);
    }
  }

  async grantAccess(subjectId: string, access: number): Promise<boolean> {
    let subjectType;
    const subjectAsTeam = await getTeamById(subjectId);
    if (subjectAsTeam) {
      subjectType = 'TEAM';
    } else {
      const subjectAsUser = await getUserById(subjectId);
      if (!subjectAsUser) {
        return false;
      }
      subjectType = 'USER';
    }
    
    if (!this.permission) {
      this.permission = {};
    }
    
    if (!this.permission.accessItems) {
      this.permission.accessItems = [];
    }

    this.permission.accessItems.push({
      subjectType,
      subjectId,
      access
    });
  }
}

export async function getOneById(userId: string, id: string): Promise<Deck> {
  const conn = await connection;
  if (!conn) {
    return null;
  }

  const dbObject = await conn.manager.findOne(Entity, id, { relations: ['owner'] });

  if (!dbObject/* || dbObject.owner.id !== userId*/) {
    return null;
  }

  let obj = new Deck();
  obj.setPropertiesFromDbObject(dbObject);

  const user = await getUserById(userId);
  if (obj.owner.id !== userId && !isAllowedToUser(user, obj as Permissioned, Access.Read)) {
    return null;
  }

  return obj;
}

export async function getAll(userId: string): Promise<Object> {
  const conn = await connection;
  if (!conn) {
    return null;
  }

  const dbObjects = await conn.manager.find(Entity);
  if (!dbObjects) {
    return null;
  }

  return dbObjects.map(dbObject => {
    let obj = new Deck();
    obj.setPropertiesFromDbObject(dbObject);
    return obj;
  });
}
