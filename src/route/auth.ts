'use strict';

import { Response, Request, Router } from 'express';
import { AUTH } from '../common/config';
import { pluckDbObject } from '../common/helpers';
import { authenticate } from '../middleware/auth/password';
import { authenticateJwt } from '../middleware/auth';
import { User, getOneById as getUserById } from '../model/user';


export const router = new Router();

router.get('/', (req: Request, res: Response) => {
  res.render('landing.ejs', {
    cfg: {
      AUTH_HOST: AUTH.url
    }
  });
});

router.get('/login', (req: Request, res: Response) => {
  res.render('login.ejs', {
    cfg: {
      AUTH_HOST: AUTH.url
    }
  });
});

router.post('/login', authenticate, (req: Request, res: Response) => {
  res.cookie('token', req.user.accessToken);
  res.redirect('/');
});

router.post('/token', authenticate, (req: Request, res: Response) => {
  res.cookie('token', req.user.accessToken);
  res.json({
    token: req.user.accessToken
  });
});

router.post('/user', async (req: Request, res: Response) => {
  const payload = req.body;

  if (!payload.username || !payload.password) {
    res.status(400).send();
  }

  const newUser = new User();
  newUser.setPropertiesFromPayload(payload);
  const saved = pluckDbObject(await newUser.save());
  res.status(202).json({
    data: saved
  });
});

router.get('/user/:userId', authenticateJwt, async (req: Request, res: Response) => {
  const user = await getUserById(req.params['userId']);
  res.status(200).send(user);
});
