import { ApolloError } from 'apollo-server-express';
import * as AWS from 'aws-sdk';
import Stripe from 'stripe';
import * as bcrypt from 'bcrypt';
import moment from 'moment';
import jwt from 'jsonwebtoken';
import { Collection, ObjectId } from 'mongodb';
import { ILoginParams, IUser } from '../../interfaces';
import { JWT_SECRET } from '../../constants';
import config from '../../config';
import { mixpanel } from '../../utils';

const stripe = new Stripe(config.STRIPE.STRIPE_SECRET, {
  apiVersion: '2020-08-27',
});

AWS.config.update({ region: 'us-east-2' });

const sqs = new AWS.SQS({ apiVersion: '2012-11-05' });

class AuthService {
  async login(User: Collection, params: ILoginParams) {
    try {
      const { email, password } = params;

      const user = await User.findOne({ email });
      if (!user) {
        throw new ApolloError('Email does not exist!', 'NO_RECORD');
      }

      const checkPassword = await bcrypt.compare(password, user.password);

      if (!checkPassword) {
        throw new ApolloError('Incorrect Password!', 'INCORRECT_PASSWORD');
      }

      mixpanel.track('Log In', {
        distinct_id: user._id.toString(),
      });

      const id = user._id;
      return {
        token: jwt.sign({ id }, JWT_SECRET, { expiresIn: '30d' }),
        user: {
          name: user.name,
          businessName: user.businessName,
          email: user.email,
          isTrial: user.isTrial,
          jobTitle: user.jobTitle,
        },
      };
    } catch (error) {
      console.log(error);
      throw new ApolloError(error);
    }
  }

  async register(User: Collection, params: IUser) {
    try {
      const { name, businessName, email, password, authProvider, jobTitle } = params;

      const existingUser = await User.findOne({ email });

      if (existingUser) {
        throw new ApolloError('User with email already exists!', 'ALREADY_EXIST');
      }

      // create stripe customer
      const stripeCustomer = await stripe.customers.create({
        email,
        name,
      });

      // Encript Password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const requestBody = JSON.stringify({
        eventName: 'welcome',
        email,
        name,
      });

      const requestBodyParams = {
        MessageBody: requestBody,
        QueueUrl: config.AWS.EMAIL_NOTIFICATIONS_SQS_URL,
      };

      sqs.sendMessage(requestBodyParams, (err) => {
        if (err) {
          throw new ApolloError(err.message);
        }
      });

      const newUser: IUser = {
        name,
        businessName,
        email,
        password: hashedPassword,
        authProvider,
        stripeCustomerId: stripeCustomer.id,
        createdAt: moment().format(),
        jobTitle,
      };

      const { insertedId } = await User.insertOne(newUser);

      mixpanel.people.set(insertedId.toString(), {
        $email: newUser.email,
        $first_name: name,
        $created: new Date().toISOString(),
        jobTitle,
        recordsScraped: 0,
        executions: 0,
      });

      mixpanel.track('Sign Up', {
        distinct_id: insertedId.toString(),
      });

      return {
        user: newUser,
        token: jwt.sign({ id: insertedId }, JWT_SECRET, { expiresIn: '30d' }),
      };
    } catch (error) {
      console.log(error);
      throw new ApolloError(error);
    }
  }

  async sendResetPasswordLink(User: Collection, { email }: { email: string }) {
    try {
      const user = await User.findOne({ email });

      if (!user) {
        throw new ApolloError('User with this email does not exists!', 'NO_RECORD');
      }

      const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1h' });

      const requestBody = JSON.stringify({
        eventName: 'reset-password',
        email: user.email,
        name: user.name,
        token,
      });

      const requestBodyParams = {
        MessageBody: requestBody,
        QueueUrl: config.AWS.EMAIL_NOTIFICATIONS_SQS_URL,
      };

      sqs.sendMessage(requestBodyParams, (err) => {
        if (err) {
          throw new ApolloError(err.message);
        }
      });

      mixpanel.track('Request Reset Password', {
        distinct_id: user._id.toString(),
      });

      return { message: 'Reset Password Email Sent Successfully!' };
    } catch (error) {
      console.log(error);
      throw new ApolloError(error);
    }
  }

  async resetPassword(
    User: Collection,
    params: { token: string; newPassword: string; email: string },
  ) {
    try {
      const { newPassword, token, email } = params;

      let uid: string | ObjectId;

      // request came from reset password page
      if (token) {
        const decodedUser = jwt.verify(token, JWT_SECRET) as any;
        uid = decodedUser.id;
      }

      // request came from profile page
      if (email) {
        const user = await User.findOne({
          email,
        });

        uid = user._id;
      }

      const user = await User.findOne({
        _id: new ObjectId(uid),
      });

      if (!user) {
        throw new ApolloError('User not found!');
      }

      const salt = await bcrypt.genSalt(10);
      const hashPassword = await bcrypt.hash(newPassword, salt);

      await User.findOneAndUpdate(
        {
          _id: new ObjectId(uid),
        },
        {
          $set: {
            password: hashPassword,
          },
        },
      );

      return {
        message: 'Password Reset Successfully!',
      };
    } catch (error) {
      console.log(error);
      if (error.name === 'TokenExpiredError') {
        throw new ApolloError('Your link is expired!');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new ApolloError('Your link is invalid!');
      }
      throw new ApolloError(error);
    }
  }
}

export default AuthService;
