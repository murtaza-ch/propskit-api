import { Db } from 'mongodb';
import { IContext } from '../../interfaces';
import { ExecutionService } from '../../services';

export default (db: Db) => {
  const executionService = new ExecutionService();
  const Executions = db.collection('executions');
  return {
    getExecuitons: async (parent: any, params: any, { user }: IContext) => {
      if (!user) {
        throw new Error('User is not authorized!');
      }

      return executionService.getExecutions(Executions, user._id);
    },
  };
};
