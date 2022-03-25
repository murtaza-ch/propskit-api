import Stripe from 'stripe';
import config from '../config';

const stripe = new Stripe(config.STRIPE.STRIPE_SECRET, {
  apiVersion: '2020-08-27',
});

export async function deleteStripeCustomer(customerId: string) {
  await stripe.customers.del(customerId);
}
