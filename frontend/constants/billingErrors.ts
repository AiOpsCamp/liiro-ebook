export const BILLING_ERROR_MESSAGES: Record<string, string> = {
  already_subscribed: "You already have an active plan. Manage it in Account settings.",
  payment_failed: "Your payment couldn't be processed. Check your payment method.",
  product_not_available: "This plan isn't available in your region. Contact support.",
  user_not_found: "Account not found. Please sign out and sign in again.",
};

export function getBillingErrorMessage(code?: string): string {
  return (code && BILLING_ERROR_MESSAGES[code]) ?? "Something went wrong. Please try again.";
}
