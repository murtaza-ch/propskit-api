import { AuthenticationError } from 'apollo-server-express';
import { Db } from 'mongodb';
import { IContext } from '../../interfaces';
import { BillingService } from '../../services';

export default (db: Db) => {
  const billingService = new BillingService();

  return {
    userBillingInfo: async (parent: any, args: any, context: IContext) => {
      if (!context.user) {
        throw new AuthenticationError('User is not authorized!');
      }

      return billingService.userBillingInfo(db, context);
    },
    addNewCard: async (parent: any, args: any, context: IContext) => {
      if (!context.user) {
        throw new AuthenticationError('User is not authorized!');
      }

      return billingService.setupNewCardIntent(db, context);
    },
  };
};
