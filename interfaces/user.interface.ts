import { ObjectId } from 'mongodb';

export default interface IUser {
  _id?: ObjectId;
  isTrial?: boolean;
  uid?: string;
  name: string;
  businessName: string;
  email: string;
  password: string;
  authProvider: string;
  stripeCustomerId: string;
  stripeSubscriptionId?: string;
  propskitSubscriptionId?: ObjectId;
  jobTitle: string;
  createdAt: string;
}

export interface IReqUser {
  _id?: string;
}

export interface IUid {
  uid: string;
}
