import { ApolloError } from 'apollo-server-express';
import { Db } from 'mongodb';
import Stripe from 'stripe';
import { IContext } from '../../interfaces';
import config from '../../config';

const stripe = new Stripe(config.STRIPE.STRIPE_SECRET, {
  apiVersion: '2020-08-27',
});

class BillingService {
  async userBillingInfo(db: Db, params: IContext) {
    const { user } = params;

    const { stripeCustomerId } = user;

    const stripeCustomer = await stripe.customers.retrieve(stripeCustomerId);

    // @ts-ignore
    const defaultPaymentMethod = stripeCustomer.invoice_settings.default_payment_method;

    const paymentMethods = await stripe.paymentMethods.list({
      customer: stripeCustomerId,
      type: 'card',
    });

    const invoices = await stripe.invoices.list({
      customer: stripeCustomerId,
    });

    const subscriptions = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      status: 'active',
    });

    let currentPlan: Stripe.Response<Stripe.Product> | null = null;
    let nextPaymentDate: number | null = null;
    let isCanceled: boolean = false;

    const activeSubscription = subscriptions.data[0];

    if (activeSubscription) {
      nextPaymentDate = activeSubscription.current_period_end;
      isCanceled = activeSubscription.cancel_at_period_end;

      const productId = activeSubscription.items.data[0].price.product;

      // @ts-ignore
      currentPlan = await stripe.products.retrieve(productId);
    }

    const mappedPaymentMethods = paymentMethods.data.map((paymentMethod) => {
      const obj = {
        id: paymentMethod.id,
        last4: paymentMethod.card.last4,
        card_brand: paymentMethod.card.brand,
        default: defaultPaymentMethod === paymentMethod.id,
      };
      return obj;
    });

    const mappedInvoices = invoices.data.map((invoice) => {
      const obj = {
        paid: invoice.created,
        invoiceId: invoice.id,
        number: invoice.number,
        status: invoice.status,
        amount: invoice.amount_due || invoice.paid,
        download_url: invoice.invoice_pdf,
      };
      return obj;
    });

    return {
      paymentMethods: mappedPaymentMethods,
      invoices: mappedInvoices,
      activeSubscription: {
        name: currentPlan?.name,
        nextPayment: nextPaymentDate,
        isCanceled,
      },
    };
  }

  async setupNewCardIntent(db: Db, params: IContext) {
    try {
      const { user } = params;

      const intent = await stripe.setupIntents.create({
        customer: user.stripeCustomerId,
        usage: 'on_session',
      });

      return intent;
    } catch (error) {
      throw new ApolloError(error);
    }
  }

  async setDefaultPaymentMethod(db: Db, params: { paymentMethodId: string; context: IContext }) {
    try {
      const {
        paymentMethodId,
        context: { user },
      } = params;

      await stripe.customers.update(user.stripeCustomerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });

      return {
        message: 'Default Payment Method set successfully!',
      };
    } catch (error) {
      console.log(error);
      throw new ApolloError(error);
    }
  }
}

export default BillingService;
