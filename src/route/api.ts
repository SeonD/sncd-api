'use strict'

import { Response, Request, Router } from 'express';
import { basicRouterFactory } from './basic';
import { getOneById as getTeamById } from '../model/team';
import { getOneById as getUserById } from '../model/user';
import { getOneById as getDeckById } from '../model/deck';

export const router = new Router();

const deckRouter = basicRouterFactory('deck');
deckRouter.post('/:deckId/grant/:subjectId', async (req: Request, res: Response) => {
    const owner = await getUserById(req.user.id);
    const deck = await getDeckById(req.user.id, req.params['deckId']);

    // Check if the owner is really the owner of the deck
    if (owner.id !== deck.owner.id) {
        res.status(403).json({});
        return;
    }

    if (typeof(req.body.access) !== 'number' || (req.body.access !== 0 && req.body.access !== 1)) {
        res.status(400).json({});
    }

    await deck.grantAccess(req.params['subjectId'], req.body.access);

    const saved = await deck.save();
    res.status(202).json({
        data: saved
    });
});

router.use('/deck', deckRouter);

const teamRouter = basicRouterFactory('team');
teamRouter.post('/:teamId/member/:userId', async (req: Request, res: Response) => {
    const team = await getTeamById(req.params['teamId']);
    const user = await getUserById(req.params['userId']);

    team.addNewMember(user);
    
    const saved = await team.save();
    res.status(202).json({
        data: saved
    });
});

router.use('/team', teamRouter);
