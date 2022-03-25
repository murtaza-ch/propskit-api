import { ApolloError } from 'apollo-server-express';
import { IContext } from '../../interfaces/index';
import { stripe, mixpanel } from '../../utils';

class SubscriptionService {
  async create(customerId: string, paymentMethodId: string, priceId: string, priceIdUsage: string) {
    try {
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });

      // Change the default invoice settings on the customer to the new payment method
      await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });

      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        default_payment_method: paymentMethodId,
        items: [
          {
            price: priceId,
          },
          {
            price: priceIdUsage,
          },
        ],
        expand: ['latest_invoice.payment_intent'],
      });

      // For some reason its not able to detect Stripe.Invoice type
      const invoice: any = subscription.latest_invoice;

      const response = {
        subscriptionId: subscription.id,
        clientSecret: invoice.payment_intent.client_secret,
        nextAction: invoice.payment_intent.next_action ? true : false,
        status: invoice.payment_intent.status,
      };
      return response;
    } catch (error) {
      console.log({ error });
      throw new ApolloError(error.message);
    }
  }

  async update(stripeSubscriptionId: string, priceId: string, priceIdUsage: string) {
    try {
      const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);

      const baseCostIndex = subscription.items.data.findIndex(
        (baseCostObj: any) => baseCostObj.plan.usage_type === 'licensed',
      );

      const unitCostIndex = subscription.items.data.findIndex(
        (unitCostObj: any) => unitCostObj.plan.usage_type === 'metered',
      );

      const items: { id: string; price: string }[] = [];

      items.splice(baseCostIndex, 0, {
        id: subscription.items.data[baseCostIndex].id,
        price: priceId,
      });
      items.splice(unitCostIndex, 0, {
        id: subscription.items.data[unitCostIndex].id,
        price: priceIdUsage,
      });

      await stripe.subscriptions.update(stripeSubscriptionId, {
        cancel_at_period_end: false,
        items,
        proration_behavior: 'none',
        billing_cycle_anchor: 'now',
      });

      return { success: true, message: 'Subscription Updated!' };
    } catch (error) {
      console.log({ error });
      throw new ApolloError(error.message);
    }
  }

  async cancel(context: IContext, cancelAtPeriodEnd: boolean) {
    try {
      await stripe.subscriptions.update(context.user.stripeSubscriptionId, {
        cancel_at_period_end: cancelAtPeriodEnd,
      });

      if (cancelAtPeriodEnd) {
        mixpanel.track('Cancel Plan', {
          distinct_id: context.user._id.toString(),
        });
      } else {
        mixpanel.track('Renew Plan', {
          distinct_id: context.user._id.toString(),
        });
      }

      return {
        success: true,
        message: cancelAtPeriodEnd ? 'Subscription Canceled!' : 'Subscription Renewed!',
      };
    } catch (error) {
      console.log({ error });
      throw new ApolloError(error.message);
    }
  }
}

export default SubscriptionService;
