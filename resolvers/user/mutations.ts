import { Db } from 'mongodb';
import { IUser, ILoginParams } from '../../interfaces';
import { AuthService } from '../../services';

export default (db: Db) => {
  const authService = new AuthService();
  const User = db.collection('users');

  return {
    login: async (parent: any, params: ILoginParams) => authService.login(User, params),
    register: async (parent: any, params: IUser) => authService.register(User, params),
    sendResetPasswordLink: async (parent: any, params: { email: string }) =>
      authService.sendResetPasswordLink(User, params),
    resetPassword: (parent: any, params: { token: string; newPassword: string; email: string }) =>
      authService.resetPassword(User, params),
  };
};
