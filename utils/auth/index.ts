import { Strategy, ExtractJwt } from 'passport-jwt';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { Db, ObjectId } from 'mongodb';
import config from '../../config';

const googleParams = {
  clientID: config.GOOGLE_AUTH_CREDENTIALS.GOOGLE_CLIENT_ID,
  clientSecret: config.GOOGLE_AUTH_CREDENTIALS.GOOGLE_CLIENT_SECRET,
  callbackURL: config.GOOGLE_AUTH_CREDENTIALS.GOOGLE_CALLBACK_URL,
};

const jwtParams = {
  secretOrKey: config.JWT_AUTH.JWT_SECRET,
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
};

const facebookParams = {
  clientID: config.FACEBOOK_AUTH_CREDENTIALS.FACEBOOK_CLIENT_ID,
  clientSecret: config.FACEBOOK_AUTH_CREDENTIALS.FACEBOOK_CLIENT_SECRET,
  callbackURL: config.FACEBOOK_AUTH_CREDENTIALS.FACEBOOK_CALLBACK_URL,
  profileFields: ['id', 'email', 'first_name', 'last_name'],
};

export const googleStrategy = (db: Db) =>
  new GoogleStrategy(
    googleParams,
    async (accessToken: string, refreshToken: string, profile: any, done: any) => {
      const User = db.collection('users');
      const matchingUser = await User.findOne({ googleId: profile.id });

      if (matchingUser) {
        done(null, matchingUser);
        return;
      }

      const newUser = {
        googleId: profile.id,
        name: `${profile.name.givenName} ${profile.name.familyName}`,
        businessName: profile.name.givenName,
        email: profile.emails && profile.emails[0] && profile.emails[0].value,
      };
      await User.insertOne(newUser);

      done(null, newUser);
    },
  );

export const facebookStrategy = (db: Db) =>
  new FacebookStrategy(
    facebookParams,
    async (accessToken: string, refreshToken: string, profile: any, done: any) => {
      const User = db.collection('users');
      const matchingUser = await User.findOne({ facebookId: profile.id });

      if (matchingUser) {
        done(null, matchingUser);
        return;
      }

      const newUser = {
        facebookId: profile.id,
        name: `${profile.name.givenName} ${profile.name.familyName}`,
        businessName: profile.name.givenName,
        email: profile.emails && profile.emails[0] && profile.emails[0].value,
      };
      await User.insertOne(newUser);

      done(null, newUser);
    },
  );

export const jwtStrategy = (db: Db) =>
  new Strategy(jwtParams, async (payload: any, done: any) => {
    const User = db.collection('users');

    const user = await User.findOne({ _id: new ObjectId(payload.id) });
    return done(null, user);
  });
