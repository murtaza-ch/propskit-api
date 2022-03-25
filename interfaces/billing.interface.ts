interface PaymentMethod {
  id: string;
  last4: string;
  card_brand: string;
  default: boolean;
}

interface Invoice {
  invoiceId: string;
  number: string;
  status: string;
  amount: number;
}

interface ActiveSubscription {
  name: string;
  nextPayment: number;
}

export default interface IUserBillingInfoPayload {
  paymentMethods: PaymentMethod[];
  invoices: Invoice[];
  activeSubscription: ActiveSubscription;
}
