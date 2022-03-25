import { Db } from 'mongodb';
import { GraphQLDateTime } from 'graphql-iso-date';
import Queries from './queries';
import Mutation from './mutations';

export default (db: Db) => ({
  Query: Queries(db),
  Mutation: Mutation(db),
  Date: GraphQLDateTime,
});
