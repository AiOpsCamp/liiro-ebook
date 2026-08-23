import type React from "react";
import { Platform } from "react-native";
import { createContext, useContext, useMemo, useState, useCallback, useEffect, useRef } from "react";
import { ToastProvider } from "@/components/ui/toast";
import useUserInfo from "@/hooks/useUserInfo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ErrorBoundary from "react-native-error-boundary";
import BugReporter from "@/lib/logger";
import { ErrorFallback } from "@/components/shared/ErrorFallback";
import { PersistGate } from "redux-persist/integration/react";
import { persistor } from "@/redux/store";
import { deleteToken } from "@/lib/utils";

interface GlobalContextProps {
  user: any;
  /**
   * Optional override setter: only use this when you intentionally want to override
   * the server-derived user (e.g. after updating profile, optimistic UI, etc).
   */
  setUser: React.Dispatch<React.SetStateAction<any>>;
  isLoading: boolean;
  refetch: (opts?: { silent?: boolean }) => Promise<void>;
  signOut: () => Promise<void>;
}

interface GlobalProviderProps {
  children: React.ReactNode;
}

const GlobalContext = createContext<GlobalContextProps>({} as GlobalContextProps);

export const useGlobalContext = () => useContext(GlobalContext);

const GlobalProvider: React.FC<GlobalProviderProps> = ({ children }) => {
  const { data, isLoading, refetch, error } = useUserInfo();

  // Safety-net: if redux-persist rehydration hangs, force-render children
  // after a timeout so the app does not get stuck on the splash screen.
  const [rehydrated, setRehydrated] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!rehydrated) {
        console.warn("⚠️ PersistGate rehydration timed out – rendering children anyway");
        setRehydrated(true);
      }
    }, 5_000);
    return () => clearTimeout(timer);
  }, [rehydrated]);

  // ✅ Local override (optional). If null => "force logged out" until cleared.
  // If undefined => no override; use server-derived data.
  const [userOverride, setUserOverride] = useState<any | undefined>(undefined);

  // ✅ Derived user (no setState-in-effect)
  const user = useMemo(() => {
    if (userOverride !== undefined) return userOverride;
    if (error) return null;
    if (data === null) return null;
    return data ?? null;
  }, [data, error, userOverride]);

  // ✅ keep reporting side-effect; no setUser here
  useEffect(() => {
    if (!error) return;
    BugReporter.report({
      message: "User data fetch failed",
      extra: error,
      severity: "error",
      screen: "GlobalProvider",
    });
  }, [error]);

  const signOut = useCallback(async () => {
    await deleteToken("token");
    await deleteToken("firebaseIdToken");
    setUserOverride(null);
    if (Platform.OS === "web" && typeof window !== "undefined" && window.location) {
      window.location.href = "/login";
    }
  }, []);

  const refetchUser = useCallback(async (opts?: { silent?: boolean }) => {
    if (userOverride === null) {
      setUserOverride(undefined);
    }
    await refetch(opts);
  }, [refetch, userOverride]);

  const handleError = useCallback((err: Error, stackTrace: string) => {
    BugReporter.report({
      message: err.message,
      extra: stackTrace,
      severity: "error",
      screen: "ErrorBoundary",
    });

    console.error("Caught by ErrorBoundary:", err, stackTrace);
  }, []);

  const value = useMemo(
    () => ({
      user,
      setUser: setUserOverride, // keep same API
      isLoading,
      refetch: refetchUser,
      signOut,
    }),
    [user, isLoading, refetchUser, signOut]
  );

  return (
    <GlobalContext.Provider value={value}>
      <ToastProvider>
        <ErrorBoundary FallbackComponent={ErrorFallback} onError={handleError}>
          <PersistGate
            loading={null}
            persistor={persistor}
            onBeforeLift={() => setRehydrated(true)}
          >
            {children}
          </PersistGate>
        </ErrorBoundary>
      </ToastProvider>
    </GlobalContext.Provider>
  );
};

export default GlobalProvider;
