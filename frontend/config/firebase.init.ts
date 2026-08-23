import { Platform } from "react-native";
import { initializeApp, getApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, initializeAuth, type Auth, getReactNativePersistence } from "firebase/auth";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";
import { getFirebaseConfig } from "./firebase.config";

const firebaseConfig = getFirebaseConfig();

// --- App (singleton) ---
export const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

// --- Auth (platform-correct) ---
// Web: MUST use getAuth(app) for popup/redirect auth flows to work correctly.
// Native: use initializeAuth with AsyncStorage persistence.

let auth: Auth;

if (Platform.OS === "web") {
  auth = getAuth(app);
} else {
  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(ReactNativeAsyncStorage),
    });
  } catch (error) {
    auth = getAuth(app);
  }
}

export { auth };
export default app;
