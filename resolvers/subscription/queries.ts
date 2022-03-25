import { Db } from 'mongodb';
import { IContext } from '../../interfaces';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default (db: Db) => ({
  subscriptions: async (parent: any, params: any, context: IContext) => {
    if (!context.user) {
      throw new Error("User isn't authorized!");
    }

    return { success: true };
  },
});
