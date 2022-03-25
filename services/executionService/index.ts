import { Collection, ObjectId } from 'mongodb';

class ExecutionService {
  async getExecutions(Executions: Collection, uid: ObjectId) {
    const executions = await Executions.find({ uid }).sort('started', -1).toArray();
    return executions;
  }
}

export default ExecutionService;
