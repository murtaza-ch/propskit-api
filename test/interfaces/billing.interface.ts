import { IUser } from '../../interfaces';

export interface ITestRegisterResponse {
  register: {
    token: string;
    user: IUser;
  };
}

export interface ITestLoginResponse {
  login: {
    token: string;
  };
}

export interface ITestSubscription {
  createSubscription: {
    subscriptionId: string;
    clientSecret: string;
    nextAction: boolean;
    status: string;
  };
}

export interface ITestSetDefaultPaymentMethod {
  setDefaultPaymentMethod: {
    message: string;
  };
}
