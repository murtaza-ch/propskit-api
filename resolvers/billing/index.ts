import { Db } from 'mongodb';
import Queries from './queries';
import Mutation from './mutations';

export default (db: Db) => ({
  Query: Queries(db),
  Mutation: Mutation(db),
});
