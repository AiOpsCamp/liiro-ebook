import { Platform } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import {
  setIsPricingLoading,
  setSubscriptionError,
  selectIsPricingLoading,
} from "@/redux/features/subscriptionSlice";
import { useCallback } from "react";

// Lazy-load react-native-purchases only on native
let Purchases: any = null;
if (Platform.OS !== "web") {
  Purchases = require("react-native-purchases").default;
}

function usePurchaseFirstAvailable() {
  const dispatch = useDispatch();
  const isPricingLoading = useSelector(selectIsPricingLoading);

  const purchase = useCallback(async () => {
    if (Platform.OS === "web" || !Purchases) {
      dispatch(setSubscriptionError("In-app purchases are not available on web"));
      return;
    }
    try {
      dispatch(setIsPricingLoading(true));
      dispatch(setSubscriptionError(null));

      const offerings = await Purchases.getOfferings();
      const current = offerings.current;
      if (!current || current.availablePackages.length === 0) {
        throw new Error("No available packages");
      }

      const selected = current.availablePackages[0];
      await Purchases.purchasePackage(selected);
    } catch (e: any) {
      dispatch(setSubscriptionError(e?.message ?? "Purchase failed"));
    } finally {
      dispatch(setIsPricingLoading(false));
    }
  }, [dispatch]);

  return { purchase, isPricingLoading };
}

export default usePurchaseFirstAvailable;
