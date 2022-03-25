import { gql } from 'apollo-server';
import type { ApolloServer, ExpressContext } from 'apollo-server-express';
import type { MongoClient } from 'mongodb';
import type { TestQuery } from 'apollo-server-integration-testing';
import { IGetMetrics } from '../interfaces';
import { startTestServer } from '../server';

const GET_METRICS = gql`
  query {
    getMetrics {
      executions
      upcomingBill {
        additionalCost
        baseCost
      }
      recordsScraped
      recordsRemaining
      recordsExceeded
    }
  }
`;

describe('DashboardResolver', () => {
  let query: TestQuery;
  let apolloServer: ApolloServer<ExpressContext>;
  let mongoClient: MongoClient;

  beforeAll(async () => {
    const { query: testQuery, client, server } = await startTestServer();
    query = testQuery;
    apolloServer = server;
    mongoClient = client;
  });

  afterAll(async () => {
    await apolloServer.stop();
    await mongoClient.close();
  });

  it('fetch dashboard metrics', async () => {
    const { data } = await query<IGetMetrics>(GET_METRICS);

    expect(data.getMetrics).toBeTruthy();
  });
});
