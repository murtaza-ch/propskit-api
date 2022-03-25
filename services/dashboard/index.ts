import { Collection, ObjectId } from 'mongodb';

class DashboardService {
  async getMetrics(
    Subscriptions: Collection,
    Executions: Collection,
    Trials: Collection,
    propskitSubscriptionId: ObjectId,
    uid: ObjectId,
    isTrial: boolean,
  ) {
    if (!isTrial) {
      const subscription = await Subscriptions.findOne({ _id: propskitSubscriptionId });

      const {
        baseCost,
        unitCost,
        recordsRemaining,
        recordsUsed,
        billingCycleStart,
        billingCycleEnd,
        recordsExceeded,
      } = subscription;

      const executions = await Executions.find({
        uid,
        started: {
          $gte: billingCycleStart,
          $lte: billingCycleEnd,
        },
      }).count();

      return {
        executions,
        upcomingBill: {
          baseCost: Number(baseCost.toFixed(2)),
          additionalCost: Number((recordsExceeded * unitCost).toFixed(2)),
        },
        recordsScraped: recordsUsed,
        recordsRemaining,
        recordsExceeded,
        billingCycleStart,
        billingCycleEnd,
      };
    }
    const { startedAt, recordsRemaining, recordsUsed } = await Trials.findOne({ uid });
    const executions = await Executions.find({
      uid,
      started: {
        $gte: startedAt,
      },
    }).count();

    return {
      executions,
      upcomingBill: {
        baseCost: 0,
        additionalCost: 0,
      },
      recordsScraped: recordsUsed,
      recordsRemaining,
      recordsExceeded: 0,
    };
  }
}

export default DashboardService;
