/**
 * Google Authentication Service
 * Handles Google Sign-In for both web and native platforms
 * 
 * Responsibilities:
 * - Platform-specific Google Sign-In initialization
 * - Web and native authentication flows
 * - Error handling and logging
 * - Token extraction and validation
 */

import { Platform } from 'react-native';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from '@/config/firebase.init';
import { getGoogleWebClientId, getGoogleNativeConfig } from '@/config/oauth.config';
import Logger from '@/lib/discord-logger';

/**
 * Native-only Google Sign-In
 */
let GoogleOneTapSignIn: any = null;
let statusCodes: any = null;
let isErrorWithCode: any = null;
let isSuccessResponse: any = null;
let isNoSavedCredentialFoundResponse: any = null;
let isCancelledResponse: any = null;

if (Platform.OS !== 'web') {
  try {
    const gsi = require('react-native-nitro-google-signin');
    GoogleOneTapSignIn = gsi.GoogleOneTapSignIn;
    statusCodes = gsi.statusCodes;
    isErrorWithCode = gsi.isErrorWithCode;
    isSuccessResponse = gsi.isSuccessResponse;
    isNoSavedCredentialFoundResponse = gsi.isNoSavedCredentialFoundResponse;
    isCancelledResponse = gsi.isCancelledResponse;
  } catch (e) {
    // Native Google Signin module optional on web
  }

  // Auto-configure Google Sign-In for native platforms when this module is loaded
  try {
    const config = getGoogleNativeConfig();
    GoogleOneTapSignIn.configure(config);
    Logger.info('GoogleAuthService', 'Google Sign-In natively configured on load');
  } catch (error: any) {
    Logger.error('GoogleAuthService', 'Google Sign-In native configuration failed: ' + error?.message);
  }
}

/**
 * Web-only Firebase Auth
 */
let signInWithPopupFunc: any = null;
let signInWithRedirectFunc: any = null;
let getRedirectResultFunc: any = null;
let onAuthStateChangedFunc: any = null;
if (Platform.OS === 'web') {
  const firebaseAuthMod = require('firebase/auth');
  signInWithPopupFunc = firebaseAuthMod.signInWithPopup;
  signInWithRedirectFunc = firebaseAuthMod.signInWithRedirect;
  getRedirectResultFunc = firebaseAuthMod.getRedirectResult;
  onAuthStateChangedFunc = firebaseAuthMod.onAuthStateChanged;
}

export interface GoogleAuthResult {
  idToken: string;
  accessToken?: string;
  user?: {
    id?: string;
    email?: string;
    name?: string;
    photo?: string;
  };
}

export interface GoogleAuthError {
  code: string;
  message: string;
  isCancelled: boolean;
}

export class GoogleAuthService {
  /**
   * Initialize Google Sign-In (native platforms only)
   */
  static initialize(): void {
    if (Platform.OS === 'web' || !GoogleOneTapSignIn) {
      return; // Web uses Firebase signInWithPopup, no initialization needed
    }

    try {
      const config = getGoogleNativeConfig();
      
      GoogleOneTapSignIn.configure(config);

      Logger.info('GoogleAuthService', 'Google Sign-In initialized successfully');
    } catch (error: any) {
      Logger.error('GoogleAuthService.initialize', error);
      throw new Error(`Google Sign-In initialization failed: ${error?.message}`);
    }
  }

  /**
   * Check for pending Google redirect auth result on page load (web).
   * Uses getRedirectResult first, then falls back to onAuthStateChanged
   * because getRedirectResult can return null when the authDomain
   * (langowords.io) differs from the app origin (localhost) — the
   * cross-origin iframe relay is blocked by COOP headers.
   */
  static async checkRedirectResult(): Promise<GoogleAuthResult | null> {
    if (Platform.OS !== 'web' || !getRedirectResultFunc) {
      return null;
    }

    // Only proceed if we set the flag before the redirect.
    const REDIRECT_FLAG = 'pendingGoogleRedirect';
    const hasPendingRedirect = typeof sessionStorage !== 'undefined'
      && !!sessionStorage.getItem(REDIRECT_FLAG);

    if (!hasPendingRedirect) {
      console.log('[GoogleAuth] checkRedirectResult: no pending redirect flag, skipping');
      return null;
    }

    // Clear the flag immediately so subsequent page loads don\'t re-trigger.
    sessionStorage.removeItem(REDIRECT_FLAG);

    try {
      console.log('[GoogleAuth] checkRedirectResult: calling getRedirectResult...');
      const result = await getRedirectResultFunc(auth);
      console.log('[GoogleAuth] checkRedirectResult: result =', result ? 'HAS_RESULT uid=' + result.user?.uid : 'NULL');
      if (result && result.user) {
        const idToken = await result.user.getIdToken(true);
        return {
          idToken,
          user: {
            id: result.user.uid,
            email: result.user.email || undefined,
            name: result.user.displayName || undefined,
            photo: result.user.photoURL || undefined,
          },
        };
      }
    } catch (error: any) {
      console.error('[GoogleAuth] checkRedirectResult ERROR:', error?.code, error?.message);
      Logger.error('GoogleAuthService.checkRedirectResult', error);
    }

    // Fallback: getRedirectResult returned null (cross-origin COOP issue).
    // Firebase's onAuthStateChanged fires reliably after signInWithRedirect
    // completes, regardless of cross-origin iframe restrictions.
    // Skip the immediate first emission (always null before Firebase processes
    // the pending redirect) — only resolve once we get a definitive answer.
    console.log('[GoogleAuth] checkRedirectResult: getRedirectResult returned null, waiting for onAuthStateChanged...');
    return new Promise((resolve) => {
      // 10s timeout safety net
      const timer = setTimeout(() => {
        console.log('[GoogleAuth] onAuthStateChanged timeout — no user after 10s');
        unsubscribe();
        resolve(null);
      }, 10000);

      let initialNullSkipped = false;
      const unsubscribe = onAuthStateChangedFunc(auth, async (user: any) => {
        if (!user && !initialNullSkipped) {
          // Firebase always emits null immediately on mount before it finishes
          // processing the pending redirect result — skip it and wait for the
          // real auth state change that follows.
          initialNullSkipped = true;
          console.log('[GoogleAuth] onAuthStateChanged: skipping initial null emission');
          return;
        }
        clearTimeout(timer);
        unsubscribe();
        if (user) {
          console.log('[GoogleAuth] onAuthStateChanged: got user uid=', user.uid);
          try {
            const idToken = await user.getIdToken(true);
            resolve({
              idToken,
              user: {
                id: user.uid,
                email: user.email || undefined,
                name: user.displayName || undefined,
                photo: user.photoURL || undefined,
              },
            });
          } catch (e) {
            resolve(null);
          }
        } else {
          console.log('[GoogleAuth] onAuthStateChanged: no user after redirect');
          resolve(null);
        }
      });
    });
  }

  /**
   * Sign in with Google (web) — uses redirect flow to avoid cross-origin
   * window.opener issues when authDomain (langowords.io) differs from the
   * app origin (localhost or any non-authDomain host).
   */
  private static async signInWeb(): Promise<GoogleAuthResult> {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    if (signInWithPopupFunc) {
      try {
        const result = await signInWithPopupFunc(auth, provider);
        if (result && result.user) {
          const idToken = await result.user.getIdToken(true);
          return {
            idToken,
            user: {
              id: result.user.uid,
              email: result.user.email || undefined,
              name: result.user.displayName || undefined,
              photo: result.user.photoURL || undefined,
            },
          };
        }
      } catch (err: any) {
        if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
          throw err;
        }
        console.warn('[GoogleAuth] Popup failed, falling back to redirect:', err?.code, err?.message);
      }
    }

    if (!signInWithRedirectFunc) {
      throw new Error('Firebase Google Auth not available on web');
    }

    // Set the flag BEFORE navigating away so checkRedirectResult knows
    // we're returning from an intentional Google redirect.
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('pendingGoogleRedirect', '1');
    }

    // This navigates the entire page to Google's OAuth endpoint.
    // The result is captured on the next page load via checkRedirectResult().
    await signInWithRedirectFunc(auth, provider);

    // Page will redirect to Google — this promise never resolves.
    return new Promise(() => {});
  }

  /**
   * Sign in with Google (native Android/iOS)
   */
  private static async signInNative(): Promise<GoogleAuthResult> {
    if (!GoogleOneTapSignIn) {
      throw new Error('Google Sign-In is not available on this platform');
    }

    // Check if Play Services are available (Android only)
    if (Platform.OS === 'android') {
      try {
        await GoogleOneTapSignIn.checkPlayServices();
      } catch (error: any) {
        Logger.error('GoogleAuthService.signInNative', error);
        throw new Error('Google Play Services are required but not available');
      }
    }

    // Sign in with Google
    let response: any;
    try {
      response = await GoogleOneTapSignIn.signIn();
    } catch (err: any) {
      Logger.error('GoogleAuthService.signInNative.signIn', err);
      throw new Error(err?.message || 'Google Sign-In failed');
    }

    if (isNoSavedCredentialFoundResponse && isNoSavedCredentialFoundResponse(response)) {
      try {
        response = await GoogleOneTapSignIn.createAccount();
      } catch (err: any) {
        Logger.error('GoogleAuthService.signInNative.createAccount', err);
        throw new Error(err?.message || 'Google account creation failed');
      }
    }

    if (isCancelledResponse && isCancelledResponse(response)) {
      throw new Error('SIGN_IN_CANCELLED');
    }

    if (!isSuccessResponse || !isSuccessResponse(response)) {
      throw new Error('Google Sign-In failed');
    }

    const { idToken } = response?.data || {};
    let accessToken: string | undefined;
    try {
      const tokens = await GoogleOneTapSignIn.getTokens();
      accessToken = tokens?.accessToken;
    } catch (e) {
      // Ignore token extraction warning
    }

    if (!idToken) {
      throw new Error(
        'Google idToken missing. ' +
        'Verify: 1) webClientId is correct 2) Firebase SHA-1/SHA-256 in Google Cloud Console 3) App is signed correctly'
      );
    }

    // Exchange token with Firebase
    const credential = GoogleAuthProvider.credential(idToken);
    const userCred = await signInWithCredential(auth, credential);
    const firebaseIdToken = await userCred.user.getIdToken(true);

    return {
      idToken: firebaseIdToken,
      accessToken,
      user: {
        id: userCred.user.uid,
        email: userCred.user.email || undefined,
        name: userCred.user.displayName || undefined,
        photo: userCred.user.photoURL || undefined,
      },
    };
  }

  /**
   * Main sign-in method
   * @returns Google auth result with Firebase ID token
   */
  static async signIn(): Promise<GoogleAuthResult> {
    try {
      if (Platform.OS === 'web') {
        return await this.signInWeb();
      } else {
        return await this.signInNative();
      }
    } catch (error: any) {
      const err = this.parseError(error);
      if (err.isCancelled) {
        Logger.info('GoogleAuthService.signIn', 'Sign-in cancelled by user');
      } else {
        Logger.error('GoogleAuthService.signIn', error);
      }
      throw err;
    }
  }

  /**
   * Check if user is currently signed in
   */
  static async isSignedIn(): Promise<boolean> {
    if (Platform.OS === 'web' || !GoogleOneTapSignIn) {
      return false;
    }

    try {
      return !!GoogleOneTapSignIn.getCurrentUser();
    } catch (error: any) {
      Logger.error('GoogleAuthService.isSignedIn', error);
      return false;
    }
  }

  /**
   * Sign out current user
   */
  static async signOut(): Promise<void> {
    if (Platform.OS === 'web' || !GoogleOneTapSignIn) {
      return;
    }

    try {
      await GoogleOneTapSignIn.signOut();
      Logger.info('GoogleAuthService', 'User signed out successfully');
    } catch (error: any) {
      Logger.error('GoogleAuthService.signOut', error);
      throw new Error(`Sign-out failed: ${error?.message}`);
    }
  }

  /**
   * Revoke access token
   */
  static async revokeAccess(): Promise<void> {
    if (Platform.OS === 'web' || !GoogleOneTapSignIn) {
      return;
    }

    try {
      const session = GoogleOneTapSignIn.getCurrentUser();
      if (session?.user?.id) {
        await GoogleOneTapSignIn.revokeAccess(session.user.id);
      } else {
        await GoogleOneTapSignIn.signOut();
      }
      Logger.info('GoogleAuthService', 'Access revoked successfully');
    } catch (error: any) {
      Logger.error('GoogleAuthService.revokeAccess', error);
      throw new Error(`Revoke failed: ${error?.message}`);
    }
  }

  /**
   * Parse and normalize Google auth errors
   */
  private static parseError(error: any): GoogleAuthError {
    let code = 'UNKNOWN_ERROR';
    let message = 'An unexpected error occurred during Google Sign-In';
    let isCancelled = false;

    // Handle native errors
    if (isErrorWithCode?.(error)) {
      if (error.code === statusCodes?.SIGN_IN_CANCELLED) {
        code = 'CANCELLED';
        message = 'Google Sign-In was cancelled by user';
        isCancelled = true;
      } else if (error.code === statusCodes?.IN_PROGRESS) {
        code = 'IN_PROGRESS';
        message = 'Google Sign-In is already in progress';
        isCancelled = false;
      } else if (error.code === statusCodes?.PLAY_SERVICES_NOT_AVAILABLE) {
        code = 'PLAY_SERVICES_NOT_AVAILABLE';
        message = 'Google Play Services are not available on this device';
        isCancelled = false;
      } else {
        code = error.code;
        message = error.message || 'Google Sign-In error';
        isCancelled = false;
      }
    }
    // Handle manual cancellation
    else if (error?.message === 'SIGN_IN_CANCELLED') {
      code = 'CANCELLED';
      message = 'Google Sign-In was cancelled by user';
      isCancelled = true;
    }
    // Handle Firebase errors
    else if (error?.code?.includes('auth/')) {
      code = error.code;
      message = this.getFirebaseErrorMessage(error.code);
      isCancelled = ['auth/popup-closed-by-user', 'auth/cancelled-popup-request', 'auth/user-cancelled'].includes(error.code);
    }
    // Handle generic errors
    else if (error?.message) {
      if (error.message.includes('auth/popup-closed-by-user') || error.message.includes('popup-closed-by-user')) {
        code = 'auth/popup-closed-by-user';
        message = this.getFirebaseErrorMessage('auth/popup-closed-by-user');
        isCancelled = true;
      } else {
        message = error.message;
        isCancelled = false;
      }
    }

    return { code, message, isCancelled };
  }

  /**
   * Get user-friendly Firebase error messages
   */
  private static getFirebaseErrorMessage(code: string): string {
    const messages: Record<string, string> = {
      'auth/popup-blocked': 'Popup window was blocked. Please enable popups for this site.',
      'auth/popup-closed-by-user': 'Google Sign-In popup was closed.',
      'auth/network-request-failed': 'Network error. Please check your internet connection.',
      'auth/operation-not-allowed': 'Google Sign-In is not enabled for this project.',
      'auth/account-exists-with-different-credential':
        'An account already exists with this email using a different sign-in method.',
      'auth/credential-already-in-use': 'This credential is already associated with a different user account.',
      'auth/invalid-credential': 'Invalid credential. Please try again.',
      'auth/unauthorized-domain': 'This domain is not authorized for Google Sign-In.',
      'auth/user-cancelled': 'Google Sign-In was cancelled.',
    };

    return messages[code] || `Google Sign-In failed (${code}). Please try again.`;
  }
}

export default GoogleAuthService;
