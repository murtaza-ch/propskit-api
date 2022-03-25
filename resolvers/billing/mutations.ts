import { Db } from 'mongodb';
import { AuthenticationError } from 'apollo-server-express';
import { IContext } from '../../interfaces';
import { BillingService } from '../../services';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default (db: Db) => {
  const billingService = new BillingService();

  return {
    setDefaultPaymentMethod: async (
      parent: any,
      { paymentMethodId }: { paymentMethodId: string },
      context: IContext,
    ) => {
      if (!context.user) {
        throw new AuthenticationError('User is not authorized!');
      }

      return billingService.setDefaultPaymentMethod(db, { paymentMethodId, context });
    },
  };
};
