import { ICreateSubscriptionData } from './subscription.interface';
import User from './user.interface';

export { default as IUser, IReqUser, IUid } from './user.interface';
export { default as ILoginParams } from './auth.interface';
export { default as IUserBillingInfo } from './billing.interface';
export { ICreateSubscriptionData } from './subscription.interface';
export { IScraperInputs } from './scraper.interface';

export interface IRequest extends Request {
  user: User;
}

export interface IContext {
  req: IRequest;
  user: User;
}

export interface IObject<T> {
  [key: string]: T;
}
