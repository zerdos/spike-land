export type FetchFn = typeof globalThis.fetch;

export const STRIPE_API_BASE = "https://api.stripe.com/v1";

export interface StripeListResponse<T> {
  object: "list";
  data: T[];
  has_more: boolean;
  url: string;
}

export interface BalanceTransaction {
  id: string;
  object: "balance_transaction";
  amount: number;
  currency: string;
  fee: number;
  net: number;
  type: string;
  created: number;
  description: string | null;
  status: string;
}

export interface Payout {
  id: string;
  object: "payout";
  amount: number;
  currency: string;
  arrival_date: number;
  created: number;
  status: string;
  description: string | null;
  method: string;
  type: string;
}

export interface Dispute {
  id: string;
  object: "dispute";
  amount: number;
  currency: string;
  status: string;
  reason: string;
  created: number;
  charge: string;
}

export interface SubscriptionItem {
  id: string;
  price: {
    id: string;
    unit_amount: number | null;
    currency: string;
    recurring: {
      interval: string;
      interval_count: number;
    } | null;
    nickname: string | null;
  };
  quantity: number;
}

export interface Subscription {
  id: string;
  object: "subscription";
  status: string;
  created: number;
  canceled_at: number | null;
  cancellation_details: {
    reason: string | null;
  } | null;
  items: {
    data: SubscriptionItem[];
  };
  customer: string;
}

export interface Charge {
  id: string;
  object: "charge";
  amount: number;
  currency: string;
  created: number;
  customer: string | null;
  status: string;
}

export interface Invoice {
  id: string;
  object: "invoice";
  amount_due: number;
  currency: string;
  due_date: number | null;
  status: string;
  customer: string;
  subscription: string | null;
}

export interface Customer {
  id: string;
  object: "customer";
  email: string | null;
  name: string | null;
  created: number;
}
