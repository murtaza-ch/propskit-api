import { MongoMemoryServer } from 'mongodb-memory-server';
import * as mongoDB from 'mongodb';

export async function connectToDatabase() {
  const mongod = await MongoMemoryServer.create({
    instance: {
      dbName: 'jest',
    },
  });

  const uri = mongod.getUri();

  const client: mongoDB.MongoClient = new mongoDB.MongoClient(uri);

  return client;
}
