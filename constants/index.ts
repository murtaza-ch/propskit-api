export const MONGO_URL =
  process.env.MONGO_URL ||
  'mongodb+srv://propskit_dev_admin:SAwbogEnTopHE@propskit-dev-cluster.xkgbz.mongodb.net/propskit-data-cluster?retryWrites=true&w=majority';
export const JWT_SECRET = process.env.JWT_SECRET || 'propskit';
export const SALT_OR_ROUNDS = process.env.SALT_OR_ROUNDS || 10;
