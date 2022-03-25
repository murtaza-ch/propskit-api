import Stripe from 'stripe';
import config from '../config';

export const stripe = new Stripe(config.STRIPE.STRIPE_SECRET, {
  apiVersion: '2020-08-27',
});
