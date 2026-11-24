export type PaymentProviderName = "moolre" | "stripe";

export type CheckoutRequest = {
  organizationId: string;
  planSlug: string;
  interval: "monthly" | "annual";
  customerEmail: string;
};

export type CheckoutResult = { url: string; externalRef: string };
