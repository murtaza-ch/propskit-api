import { gql } from 'apollo-server-express';
import { createTestClient } from 'apollo-server-integration-testing';
import * as mongoDb from 'mongodb';
import startApolloServer from './server';
import { connectToDatabase } from './db';
import typeDefs from '../../schemas';
import resolvers from '../../resolvers';

export async function startTestServer() {
  const client = await connectToDatabase();

  await client.connect();

  const db: mongoDb.Db = client.db(process.env.DB_NAME);

  const schema = {
    typeDefs: gql`
      ${typeDefs}
    `,
    resolvers: resolvers(db),
  };

  const server = await startApolloServer(schema, db);

  const testClient = createTestClient({
    apolloServer: server,
  });

  return { ...testClient, client, server };
}
