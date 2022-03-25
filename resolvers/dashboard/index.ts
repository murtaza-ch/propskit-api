import { Db } from 'mongodb';
import { GraphQLDateTime } from 'graphql-iso-date';
import Queries from './queries';

export default (db: Db) => ({
  Query: Queries(db),
  Date: GraphQLDateTime,
});
