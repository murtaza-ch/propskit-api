import { Db, ObjectId } from 'mongodb';

class UserService {
  db: Db;

  constructor(db: Db) {
    this.db = db;
  }

  async getUserById(_id: string) {
    const usersCollection = this.db.collection('users');
    const user = await usersCollection.findOne({ _id: new ObjectId(_id) });
    return user;
  }

  async getCurrentUser(_id: ObjectId) {
    const usersCollection = this.db.collection('users');
    const user = await usersCollection.findOne({ _id });
    return user;
  }
}

export default UserService;
