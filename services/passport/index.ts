import jwt from 'jsonwebtoken';
import { Application, Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { IReqUser } from '../../interfaces';

const passportAuth = (app: Application) => {
  app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

  app.get(
    '/auth/google/callback',
    passport.authenticate('google', {
      failureRedirect: `${process.env.API_URL}/graphql`,
      session: false,
    }),
    (req: Request, res: Response) => {
      const user: IReqUser = req.user;
      const id = user._id;
      const token = jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

      res.json({ token });
    },
  );

  app.get('/auth/facebook', passport.authenticate('facebook', { scope: ['email'] }));

  app.get(
    '/auth/facebook/callback',
    passport.authenticate('facebook', {
      failureRedirect: `${process.env.API_URL}/graphql`,
      session: false,
    }),
    (req: Request, res: Response) => {
      const user: IReqUser = req.user;
      const id = user._id;
      const token = jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

      res.json({ token });
    },
  );

  app.use('/graphql', (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate('jwt', { session: false }, (err: Error | null, user: object) => {
      if (user) {
        req.user = user;
      }
      next();
    })(req, res, next);
  });

  return app;
};

export default passportAuth;
