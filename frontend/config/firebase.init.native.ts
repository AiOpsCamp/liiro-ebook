import { initializeApp, getApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, initializeAuth, type Auth, getReactNativePersistence } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getFirebaseConfig } from "./firebase.config";

const firebaseConfig = getFirebaseConfig();

export const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

let authInstance: Auth;
try {
  authInstance = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (error) {
  authInstance = getAuth(app);
}

export const auth = authInstance;

export default app;
