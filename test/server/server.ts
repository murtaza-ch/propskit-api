import { ApolloServer } from 'apollo-server-express';
import { ApolloServerPluginDrainHttpServer } from 'apollo-server-core';
import express, { Application } from 'express';
import cors from 'cors';
import passport from 'passport';
import { Db, ObjectId } from 'mongodb';
import http from 'http';
import { jwtStrategy, googleStrategy, facebookStrategy } from '../../utils';
import { passportAuth } from '../../services';

async function startApolloServer(schema: any, db: Db) {
  passport.use(jwtStrategy(db));
  passport.use(googleStrategy(db));
  passport.use(facebookStrategy(db));

  passport.initialize();

  let app: Application = express();
  app.use(cors({ credentials: true }));

  app = passportAuth(app);

  const httpServer = http.createServer(app);

  const server = new ApolloServer({
    ...schema,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
    context: async ({ req }) => ({
      req,
      user: {
        stripeCustomerId: 'cus_L2ygNV0mQdQFRH',
        propskitSubscriptionId: new ObjectId('61f66acf6fc544cc98780b25'),
        _id: new ObjectId('61f8d892c2feab204b8dd301'),
      },
    }),
  });

  await server.start();
  server.applyMiddleware({ app, cors: false });

  return server;
}

export default startApolloServer;
