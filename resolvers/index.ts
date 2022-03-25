import { combineResolvers } from 'apollo-resolvers';
import { Db } from 'mongodb';
import Users from './user';
import Billing from './billing';
import Execuiton from './executions';
import Subscription from './subscription';
import Scraper from './scraper';
import Dashboard from './dashboard';

/**
 *
 * NOTE: We can access MongoDb instance in every queries and mutation files
 */

const resolvers = (db: Db) =>
  combineResolvers([Users(db), Billing(db), Execuiton(db), Subscription(db), Scraper(db), Dashboard(db)]);

export default resolvers;
