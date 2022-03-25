import { Db } from 'mongodb';
import { IContext } from '../../interfaces';
import { UserService } from '../../services';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default (db: Db) => {
  const userService = new UserService(db);
  return {
    isAuthorized: async (parent: any, params: any, context: IContext) => {
      if (!context.user) {
        throw new Error("User isn't authorized!");
      }

      return { success: true };
    },
    getCurrentUser: async (parent: any, params: any, context: IContext) => {
      if (!context.user) {
        throw new Error("User isn't authorized!");
      }

      const response = await userService.getCurrentUser(context.user._id);
      return response;
    },
  };
};
