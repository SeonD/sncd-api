'use strict';

import { Deck, getOneById as getDeckById, getAll as getAllDecks } from '../model/deck';
import { Team, getOneById as getTeamById } from '../model/team';

export async function createEntity(entity: string, userId: string, payload: Object): Promise<Object> {
  const obj = await getNewObject(entity, userId, payload);
  return await obj.save();
}

export function updateEntityById(entity: string, userId: string, objId: string, payload: Object): Promise<Object> {
  return getOneById(entity, userId, objId).then((obj: Deck) => {
    obj.setPropertiesFromPayload(userId, payload);
    return obj.save();
  });
}

export function getAll(entity: string, userId: string, cascade: boolean = false): Promise<Object> {
  switch (entity) {
    case 'deck':
      return getAllDecks(userId);
  }
}

export async function getOneById(entity: string, userId: string, objId: string, cascade: boolean = false): Promise<Deck | Team> {
  switch (entity) {
    case 'deck':
      return await getDeckById(userId, objId);
    case 'team':
      return await getTeamById(objId);
  }
}

async function getNewObject(entity: string, userId: string, payload: any): Promise<any> {
  let obj;
  switch (entity) {
    case 'deck':
      obj = new Deck();
      break;
    case 'team':
      obj = new Team();
      break;
  }
  await obj.init(userId, payload);
  return obj;
}

export async function deleteEntityById(entity: string, userId: string, objId: string): Promise<void> {
  const obj: Deck | Team = await getOneById(entity, userId, objId);
  obj.delete();
}
