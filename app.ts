import dotenv from 'dotenv';
import gql from 'graphql-tag';
import Mongo from 'mongodb';
import { startApolloServer, connectToDatabase } from './bootstrap';
import resolvers from './resolvers';
import typeDefs from './schemas';

dotenv.config();

const init = async () => {
  try {
    // Initializing DB connection:
    const db: Mongo.Db = await connectToDatabase();

    const schema = {
      typeDefs: gql`
        ${typeDefs}
      `,
      resolvers: resolvers(db),
    };

    await startApolloServer(schema, db);
  } catch (error) {
    console.log(error);
  }
};

init();
