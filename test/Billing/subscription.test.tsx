import 'stripe';
import { gql } from 'apollo-server';
import type { ApolloServer, ExpressContext } from 'apollo-server-express';
import type { MongoClient } from 'mongodb';
import type { TestQuery } from 'apollo-server-integration-testing';
import { ITestSubscription } from '../interfaces';
import { startTestServer } from '../server';

jest.mock('stripe', () =>
  jest.fn().mockImplementation(() => ({
    paymentMethods: {
      attach: () => {},
    },
    customers: {
      update: () => {},
    },
    subscriptions: {
      create: () => ({
        id: 'sub_123',
        latest_invoice: {
          payment_intent: {
            client_secret: 'secret',
            status: 'succeeded',
          },
        },
      }),
    },
  })),
);

const CREATE_SUBSCRIPTION = gql`
  mutation createSubscription($paymentMethodId: String, $priceId: String, $priceIdUsage: String) {
    createSubscription(
      paymentMethodId: $paymentMethodId
      priceId: $priceId
      priceIdUsage: $priceIdUsage
    ) {
      subscriptionId
      clientSecret
      nextAction
      status
    }
  }
`;

describe('SubscriptionResolver', () => {
  let mutate: TestQuery;
  let apolloServer: ApolloServer<ExpressContext>;
  let mongoClient: MongoClient;

  beforeAll(async () => {
    const { mutate: mutationQuery, client, server } = await startTestServer();
    mutate = mutationQuery;
    apolloServer = server;
    mongoClient = client;
  });

  afterAll(async () => {
    await apolloServer.stop();
    await mongoClient.close();
  });

  it('should create subscription', async () => {
    const { data } = await mutate<ITestSubscription>(CREATE_SUBSCRIPTION, {
      variables: {
        paymentMethodId: 'pm_123',
        priceId: 'p_123',
        priceIdUsage: 'p_123',
      },
    });

    expect(data.createSubscription.status).toBe('succeeded');
  });
});
