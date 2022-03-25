import { Db } from 'mongodb';
import { mixpanel } from '../../utils';
import { SubscriptionService } from '../../services';
import { ICreateSubscriptionData, IContext } from '../../interfaces';

export default (db: Db) => {
  const subscriptionService = new SubscriptionService();

  return {
    createSubscription: async (
      parent: any,
      { paymentMethodId, priceId, priceIdUsage }: ICreateSubscriptionData,
      context: IContext,
    ) => {
      if (!context.user) {
        throw new Error("User isn't authorized!");
      }
      const response = await subscriptionService.create(
        context.user.stripeCustomerId,
        paymentMethodId,
        priceId,
        priceIdUsage,
      );

      return response;
    },

    updateSubscription: async (
      parent: any,
      { priceId, priceIdUsage }: { priceId: string; priceIdUsage: string },
      { user }: IContext,
    ) => {
      if (!user) {
        throw new Error("User isn't authorized!");
      }

      const response = await subscriptionService.update(
        user.stripeSubscriptionId,
        priceId,
        priceIdUsage,
      );
      return response;
    },
    startTrial: async (parent: any, args: any, context: IContext) => {
      if (!context.user) {
        throw new Error("User isn't authorized!");
      }
      const userCollection = db.collection('users');
      const trialCollection = db.collection('trials');
      const { insertedId } = await trialCollection.insertOne({
        recordsAllowed: 100,
        uid: context.user._id,
        recordsUsed: 0,
        recordsRemaining: 100,
        startedAt: new Date(),
      });

      await userCollection.findOneAndUpdate(
        {
          _id: context.user._id,
        },
        {
          $set: {
            trial: insertedId,
            isTrial: true,
          },
        },
        { upsert: true },
      );

      mixpanel.track('Start Trial', {
        distinct_id: context.user._id.toString(),
      });

      mixpanel.people.set(context.user._id.toString(), {
        plan: 'trial',
      });

      return 'Trial Started';
    },
    cancelSubscription: async (
      parent: any,
      { cancelAtPeriodEnd }: { cancelAtPeriodEnd: boolean },
      context: IContext,
    ) => {
      if (!context.user) {
        throw new Error("User isn't authorized!");
      }

      const response = await subscriptionService.cancel(context, cancelAtPeriodEnd);
      return response;
    },
  };
};
