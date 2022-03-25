import { gql } from 'apollo-server';
import type { ApolloServer, ExpressContext } from 'apollo-server-express';
import type { MongoClient } from 'mongodb';
import type { TestQuery, TestSetOptions } from 'apollo-server-integration-testing';
import { ITestUserBillingInfoResponse } from '../interfaces';
import { startTestServer } from '../server';

const USER_BILLING_INFO = gql`
  query UserBillingInfo {
    userBillingInfo {
      paymentMethods {
        card_brand
        default
        id
        last4
      }
      invoices {
        amount
        invoiceId
        number
        status
      }
      activeSubscription {
        name
        nextPayment
      }
    }
  }
`;

describe('BillingResolver', () => {
  let query: TestQuery;
  let setOption: TestSetOptions;
  let apolloServer: ApolloServer<ExpressContext>;
  let mongoClient: MongoClient;

  beforeAll(async () => {
    const {
      query: testQuery,
      setOptions: testSetOptions,
      client,
      server,
    } = await startTestServer();
    query = testQuery;
    setOption = testSetOptions;
    apolloServer = server;
    mongoClient = client;

    setOption({
      request: {
        user: {
          stripeCustomerId: 'cus_KyoqXYsxmJCzlL',
        },
      },
    });
  });

  afterAll(async () => {
    await apolloServer.stop();
    await mongoClient.close();
  });

  it("fetch user's billing info", async () => {
    const result = await query<ITestUserBillingInfoResponse>(USER_BILLING_INFO);

    expect(result.data.userBillingInfo).toBeTruthy();
  });
});
