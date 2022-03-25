import express, { Application } from 'express';
import { Db } from 'mongodb';
import { stripe, mixpanel } from '../utils';
import config from '../config';

const stripeWebhook = (app: Application, db: Db) => {
  app.post('/webhooks', express.raw({ type: 'application/json' }), async (req, res) => {
    const stripeSecret = config.STRIPE.SIGNING_SECRET;
    const header = stripe.webhooks.generateTestHeaderString({
      payload: req.body,
      secret: stripeSecret,
    });

    const event = stripe.webhooks.constructEvent(req.body, header, stripeSecret);

    const dataObject: any = event.data.object;
    try {
      const Users = db.collection('users');
      const Subscription = await db.collection('subscriptions');

      switch (event.type) {
        case 'invoice.payment_succeeded':
          try {
            const user = await Users.findOne({
              stripeCustomerId: dataObject.customer,
            });

            const baseCostObject = dataObject.lines.data.find(
              (baseCostObj: any) => baseCostObj.plan.usage_type === 'licensed',
            );

            const unitCostObject = dataObject.lines.data.find(
              (unitCostObj: any) => unitCostObj.plan.usage_type === 'metered',
            );

            const baseCost = baseCostObject.plan.amount / 100;
            const unitCost = unitCostObject.plan.amount / 100;
            const billingCycleStart = new Date(dataObject.lines.data[0].period.start * 1000);
            const billingCycleEnd = new Date(dataObject.lines.data[0].period.end * 1000);

            const product = await stripe.products.retrieve(dataObject.lines.data[0].plan.product);

            const { insertedId } = await Subscription.insertOne({
              billingCycleStart,
              billingCycleEnd,
              recordsUsed: 0,
              baseCost,
              unitCost,
              recordsAllowed: +product.metadata.records,
              recordsRemaining: +product.metadata.records,
              recordsExceeded: 0,
              uid: user ? user._id : null,
            });

            if (!user.stripeSubscriptionId) {
              mixpanel.track('Buy Plan', {
                distinct_id: user._id.toString(),
                plan: product.name,
              });

              mixpanel.people.set(user._id.toString(), {
                plan: product.name,
              });
            }

            await Users.updateOne(
              {
                stripeCustomerId: dataObject.customer,
              },
              {
                $set: {
                  stripeSubscriptionId: dataObject.subscription,
                  propskitSubscriptionId: insertedId,
                  isTrial: false,
                },
              },
              { upsert: true },
            );

            return res.status(200).json({ message: 'Event Listened!' });
          } catch (error) {
            console.log({ error });
            return res.status(400).json({ error });
          }
        case 'customer.subscription.updated':
          try {
            const user = await Users.findOne({
              stripeCustomerId: dataObject.customer,
            });
            if (user.stripeSubscriptionId === dataObject.id) {
              if (dataObject.cancel_at_period_end) {
                await Subscription.findOneAndUpdate(
                  {
                    _id: user.propskitSubscriptionId,
                  },
                  {
                    $set: {
                      canceledAt: new Date(dataObject.cancel_at * 1000),
                    },
                  },
                  { upsert: true },
                );
                return res
                  .status(200)
                  .json({ message: 'Event listened on subscritption canceled!' });
              }

              const baseCostObject = dataObject.items.data.find(
                (baseCostObj: any) => baseCostObj.plan.usage_type === 'licensed',
              );

              const unitCostObject = dataObject.items.data.find(
                (unitCostObj: any) => unitCostObj.plan.usage_type === 'metered',
              );

              const baseCost = baseCostObject.plan.amount / 100;
              const unitCost = unitCostObject.plan.amount / 100;
              const billingCycleStart = new Date(dataObject.current_period_start * 1000);
              const billingCycleEnd = new Date(dataObject.current_period_end * 1000);

              const product = await stripe.products.retrieve(baseCostObject.plan.product);

              mixpanel.track('Change Plan', {
                distinct_id: user._id.toString(),
                plan: product.name,
              });

              mixpanel.people.set(user._id.toString(), {
                plan: product.name,
              });

              const { insertedId } = await Subscription.insertOne({
                billingCycleStart,
                billingCycleEnd,
                recordsUsed: 0,
                baseCost,
                unitCost,
                recordsAllowed: +product.metadata.records,
                recordsRemaining: +product.metadata.records,
                recordsExceeded: 0,
                uid: user ? user._id : null,
              });

              await Subscription.findOneAndUpdate(
                { _id: user.propskitSubscriptionId },
                {
                  $set: { billingCycleEnd: new Date() },
                },
                { upsert: true },
              );

              await Users.findOneAndUpdate(
                {
                  stripeCustomerId: dataObject.customer,
                },
                {
                  $set: {
                    // stripeSubscriptionId: dataObject.id,
                    propskitSubscriptionId: insertedId,
                    isTrial: false,
                  },
                },
                { upsert: true },
              );
            }

            console.log('success');
            return res.status(200).json({ message: 'Event listened on subscription update!' });
          } catch (error) {
            console.log({ error });
            return res.status(400).json({ error });
          }
        default:
          return res.status(200).end();
      }
    } catch (e) {
      console.log({ e });
      return res.status(400).json({ e });
    }
  });

  return app;
};

export default stripeWebhook;
