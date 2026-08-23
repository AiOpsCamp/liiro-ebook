import { initializeApp, getApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirebaseConfig } from "./firebase.config";

const firebaseConfig = getFirebaseConfig();

export const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth: Auth = getAuth(app);

export default app;
