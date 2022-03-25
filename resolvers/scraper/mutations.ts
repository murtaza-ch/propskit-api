import { Db } from 'mongodb';
import { AuthenticationError, UserInputError } from 'apollo-server-core';
import { ScraperSerivce } from '../../services';
import { IScraperInputs, IContext } from '../../interfaces';

export default (db: Db) => {
  const scraperService = new ScraperSerivce(db);

  return {
    runScraper: async (parent: any, args: IScraperInputs, context: IContext) => {
      if (!context.user) {
        throw new AuthenticationError('User is not authorized!');
      }

      if (args.inputsTransformed.search.toString().trim() === '') {
        throw new UserInputError('Location not provided');
      }
      return scraperService.run(context.user, args.inputs, args.inputsTransformed);
    },
  };
};
