/**
 * XP Toast Global Helper
 *
 * Module-level ref pattern (same as lib/alert.ts) so that
 * non-React code (e.g. api/mainQuery.ts) can trigger XP toasts.
 */

let xpToastRef: {
  showXpToast: (amount: number) => void;
} | null = null;

/**
 * Set the XP toast reference from XpToastProvider.
 * Called internally by XpToastProvider on mount.
 */
export const setXpToastRef = (ref: typeof xpToastRef) => {
  xpToastRef = ref;
};

/**
 * Show a premium XP earned toast notification.
 * Safe to call from anywhere — will no-op if the provider hasn't mounted yet.
 */
export const showXpToast = (amount: number): void => {
  if (!xpToastRef) {
    console.warn("[XpToast] Provider not mounted yet — skipping toast for", amount, "XP");
    return;
  }
  xpToastRef.showXpToast(amount);
};
