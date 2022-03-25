import { Db } from 'mongodb';
import { IContext } from '../../interfaces';
import { DashboardService } from '../../services';

export default (db: Db) => {
  const dashboardService = new DashboardService();
  const Subscriptions = db.collection('subscriptions');
  const Executions = db.collection('executions');
  const Trials = db.collection('trials');
  return {
    getMetrics: async (parent: any, params: any, { user }: IContext) => {
      if (!user) {
        throw new Error("User isn't authorized!");
      }

      const response = await dashboardService.getMetrics(
        Subscriptions,
        Executions,
        Trials,
        user.propskitSubscriptionId,
        user._id,
        user.isTrial,
      );
      return response;
    },
  };
};
