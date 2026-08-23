import { useState, useEffect, useCallback, useRef } from "react";
import { AppState, Platform } from "react-native";
import axios from "axios";
import { getApiBaseURL } from "@/config/config";
import { getToken } from "@/lib/utils";

interface UserInfo {
  data: any;
  id: string;
  name: string;
  email: string;
}

// Ignore focus/foreground refreshes that fire closer together than this, so we
// don't hammer /auth/v2/me when several events fire at once (focus + visibility).
const REFRESH_THROTTLE_MS = 4000;

const useUserInfo = () => {
  const [data, setData] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const inFlightRef = useRef(false);
  const lastFetchRef = useRef(0);

  const fetchUserInfo = useCallback(async (opts?: { silent?: boolean }) => {
    // Prevent overlapping requests (e.g. focus event mid-initial-load).
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    lastFetchRef.current = Date.now();

    // "silent" background refreshes keep the current UI instead of flashing a
    // loading state — used for focus/foreground re-checks.
    if (!opts?.silent) setIsLoading(true);
    setError(null);
    try {
      const token = await getToken("token");

      if (!token) {
        setData(null);
        return;
      }

      const response = await axios.get(`${getApiBaseURL()}/auth/v2/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setData(response.data);
    } catch (err: any) {
      console.log("Fetch User Info Error:", err);
      setError(err?.message || "Failed to fetch user info");
      if (!opts?.silent) setData(null);
    } finally {
      setIsLoading(false);
      inFlightRef.current = false;
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchUserInfo();
  }, [fetchUserInfo]);

  // Auto re-check when the user returns to the tab (web) or foregrounds the app
  // (native). This is what makes premium/plan changes appear WITHOUT a manual
  // reload — coming back from Stripe checkout, another tab, or the store all
  // trigger a fresh /auth/v2/me.
  useEffect(() => {
    const maybeRefresh = () => {
      if (Date.now() - lastFetchRef.current < REFRESH_THROTTLE_MS) return;
      fetchUserInfo({ silent: true });
    };

    if (Platform.OS === "web") {
      if (typeof window === "undefined" || typeof document === "undefined") return;
      const onFocus = () => maybeRefresh();
      const onVisibility = () => {
        if (document.visibilityState === "visible") maybeRefresh();
      };
      window.addEventListener("focus", onFocus);
      document.addEventListener("visibilitychange", onVisibility);
      return () => {
        window.removeEventListener("focus", onFocus);
        document.removeEventListener("visibilitychange", onVisibility);
      };
    }

    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") maybeRefresh();
    });
    return () => sub.remove();
  }, [fetchUserInfo]);

  return { data, isLoading, error, refetch: fetchUserInfo };
};

export default useUserInfo;
