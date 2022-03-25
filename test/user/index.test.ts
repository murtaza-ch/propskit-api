/* eslint-disable arrow-body-style */
import type { TestQuery } from 'apollo-server-integration-testing';
import type { ApolloServer, ExpressContext } from 'apollo-server-express';
import { gql } from 'apollo-server';
import type { MongoClient } from 'mongodb';
import { ITestLoginResponse, ITestRegisterResponse } from '../interfaces';
import { startTestServer } from '../server';
import { deleteStripeCustomer } from '../../utils';

const REGISTER = gql`
  mutation Register($name: String!, $email: String!, $password: String!) {
    register(name: $name, email: $email, password: $password) {
      token
      user {
        name
        email
        stripeCustomerId
      }
    }
  }
`;

const LOGIN = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
    }
  }
`;

describe('UserResolver', () => {
  let mutate: TestQuery;
  let apolloServer: ApolloServer<ExpressContext>;
  let mongoClient: MongoClient;

  beforeAll(async () => {
    const { mutate: testMutate, client, server } = await startTestServer();

    mutate = testMutate;
    apolloServer = server;
    mongoClient = client;
  });

  afterAll(async () => {
    await apolloServer.stop();
    await mongoClient.close();
  });

  it('should register user with email password', async () => {
    const result = await mutate<ITestRegisterResponse>(REGISTER, {
      variables: {
        name: 'testuser',
        email: 'test@gmail.com',
        password: 'test@1234',
      },
    });

    const { token, user } = result.data.register;

    expect(user.name).toBe('testuser');
    expect(user.email).toBe('test@gmail.com');
    expect(token).toBeTruthy();

    // removing created customer from stripe
    await deleteStripeCustomer(user.stripeCustomerId);
  });

  it('should thorw already-exits error', async () => {
    const result = await mutate<ITestRegisterResponse>(REGISTER, {
      variables: {
        name: 'testuser',
        email: 'test@gmail.com',
        password: 'test@1234',
      },
    });

    expect(result.errors[0].message).toBe('User with email already exists!');
  });

  it('should login user successfully', async () => {
    const result = await mutate<ITestLoginResponse>(LOGIN, {
      variables: {
        email: 'test@gmail.com',
        password: 'test@1234',
      },
    });

    const { token } = result.data.login;

    expect(token).toBeTruthy();
  });

  it('should throw error if user does not exists', async () => {
    const result = await mutate<ITestLoginResponse>(LOGIN, {
      variables: {
        email: 'no_user@test.com',
        password: 'test@1234',
      },
    });

    expect(result.errors[0].message).toBe('Email does not exists!');
  });
});
