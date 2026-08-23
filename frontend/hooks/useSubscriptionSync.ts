import { useEffect, useRef } from "react";
import { AppState, Platform } from "react-native";
import { useDispatch } from "react-redux";
import axios from "axios";
import { useGlobalContext } from "@/context/GlobalContext";
import { getApiBaseURL } from "@/config/config";
import { getToken } from "@/lib/utils";
import { configureRevenueCatOnce, Purchases } from "@/components/paywall/rcClient";
import {
  setCustomerInfo,
  setSubscriptionFromApi,
} from "@/redux/features/subscriptionSlice";

/**
 * Universal Subscription Sync Hook.
 * Ensures subscription status is continuously synchronized across RevenueCat/Stripe,
 * Redux Store, GlobalContext, and Backend DB.
 */
export function useSubscriptionSync() {
  const dispatch = useDispatch();
  const { user, refetch: refetchUser } = useGlobalContext();
  const userId = user?.data?._id;
  const currentSub = user?.data?.currentSubscription;

  const appState = useRef(AppState.currentState);

  // 1. Keep Redux store in sync whenever user object updates from backend
  useEffect(() => {
    if (user?.data) {
      dispatch(setSubscriptionFromApi(user.data));
    }
  }, [user?.data, dispatch]);

  // 2. Real-time RevenueCat Customer Info Listener (iOS & Android)
  useEffect(() => {
    if (Platform.OS === "web" || !userId) return;

    let isMounted = true;
    let removeListener: (() => void) | null = null;

    (async () => {
      try {
        await configureRevenueCatOnce(userId);

        if (!Purchases) return;

        // Fetch initial customer info on mount
        const initialInfo = await Purchases.getCustomerInfo();
        if (isMounted && initialInfo) {
          dispatch(setCustomerInfo(initialInfo));
        }

        // Attach listener for real-time StoreKit/Play Store updates
        if (Purchases.addCustomerInfoUpdateListener) {
          const listener = Purchases.addCustomerInfoUpdateListener(
            (info: any) => {
              if (!isMounted || !info) return;

              dispatch(setCustomerInfo(info));

              // Background sync with backend server
              (async () => {
                try {
                  const token = await getToken("token");
                  if (token && userId) {
                    await axios.post(
                      `${getApiBaseURL()}/billing/revenuecat/sync`,
                      { rcAppUserId: userId },
                      { headers: { Authorization: `Bearer ${token}` } }
                    );
                    await refetchUser({ silent: true });
                  }
                } catch (e) {
                  // Silent catch for background sync retries
                }
              })();
            }
          );

          if (typeof listener === "function") {
            removeListener = listener;
          } else if (listener && typeof listener.remove === "function") {
            removeListener = () => listener.remove();
          }
        }
      } catch (err) {
        console.warn("[SubscriptionSync] RevenueCat listener init error:", err);
      }
    })();

    return () => {
      isMounted = false;
      if (removeListener) removeListener();
    };
  }, [userId, dispatch, refetchUser]);

  // 3. AppState Foreground Listener (Handles returning from background, Apple Subscription settings, etc.)
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        // App has come to the foreground
        if (Platform.OS !== "web" && Purchases && userId) {
          (async () => {
            try {
              const info = await Purchases.getCustomerInfo();
              if (info) {
                dispatch(setCustomerInfo(info));
              }
              const token = await getToken("token");
              if (token) {
                await axios.post(
                  `${getApiBaseURL()}/billing/revenuecat/sync`,
                  { rcAppUserId: userId },
                  { headers: { Authorization: `Bearer ${token}` } }
                );
              }
            } catch (e) {
              // Silent catch
            } finally {
              refetchUser({ silent: true });
            }
          })();
        } else {
          // On Web, refetch user data when returning to tab/window
          refetchUser({ silent: true });
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [userId, dispatch, refetchUser]);
}
