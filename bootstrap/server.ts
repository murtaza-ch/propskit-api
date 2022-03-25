import jwt, { JwtPayload } from 'jsonwebtoken';
import { ApolloServer } from 'apollo-server-express';
import { ApolloServerPluginDrainHttpServer } from 'apollo-server-core';
import express, { Application } from 'express';
import cors from 'cors';
import passport from 'passport';
import { Db } from 'mongodb';
import http from 'http';
import { jwtStrategy, googleStrategy, facebookStrategy } from '../utils';
import { passportAuth, UserService } from '../services';
import { stripeWebhook } from '../webhooks';
import config from '../config';

interface IDecodedUser extends JwtPayload {
  id: string;
}

async function startApolloServer(schema: any, db: Db) {
  const userService = new UserService(db);
  passport.use(jwtStrategy(db));
  passport.use(googleStrategy(db));
  passport.use(facebookStrategy(db));

  passport.initialize();

  let app: Application = express();
  app.use(cors({ credentials: true }));

  app = passportAuth(app);
  app = stripeWebhook(app, db);

  const httpServer = http.createServer(app);

  const server = new ApolloServer({
    ...schema,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
    context: async ({ req }) => {
      const token = req.headers.authorization || '';

      let user;
      if (token) {
        const decodedUser = jwt.verify(token, config.JWT_AUTH.JWT_SECRET) as IDecodedUser;
        if (decodedUser) {
          user = await userService.getUserById(decodedUser?.id);
        }
      }

      return {
        req,
        user,
      };
    },
  });

  await server.start();

  server.applyMiddleware({ app, cors: true });

  await new Promise<void>((resolve) =>
    httpServer.listen({ port: process.env.PORT || 4000 }, resolve),
  );

  console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`);
}

export default startApolloServer;
