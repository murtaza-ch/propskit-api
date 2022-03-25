import * as mongoDB from 'mongodb';
import { MONGO_URL } from '../constants';

export async function connectToDatabase() {
  const client: mongoDB.MongoClient = new mongoDB.MongoClient(MONGO_URL);

  await client.connect();

  const db: mongoDB.Db = client.db(process.env.DB_NAME);
  console.log(`Successfully connected to database: ${db.databaseName}`);
  return db;
}
