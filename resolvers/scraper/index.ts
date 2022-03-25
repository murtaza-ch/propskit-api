import { Db } from 'mongodb';
import { GraphQLDateTime } from 'graphql-iso-date';
import Mutation from './mutations';

export default (db: Db) => ({
  Mutation: Mutation(db),
  Date: GraphQLDateTime,
});
