/**
 * Authentication Hooks
 * Provides composable authentication logic for login, register, and social auth
 * 
 * Hooks:
 * - useEmailAuth: Email/password login and registration
 * - useGoogleAuth: Google sign-in/sign-up
 * - useAppleAuth: Apple sign-in (iOS only)
 * - useAuthNavigation: Post-auth navigation logic
 */

import { useCallback, useState } from 'react';
import { useRouter } from 'expo-router';
import { Platform, Keyboard } from 'react-native';
import * as Haptics from 'expo-haptics';
import * as AppleAuthentication from 'expo-apple-authentication';
import { OAuthProvider, signInWithCredential } from 'firebase/auth';

import { auth } from '@/config/firebase.init';
import { saveToken } from '@/lib/utils';
import { useGlobalContext } from '@/context/GlobalContext';
import Logger from '@/lib/discord-logger';
import { 
  useLoginMutation, 
  useRegisterMutation, 
  useFirebaseExchangeMutation,
  useGoogleAuthMutation 
} from '@/redux/query/auth-query';
import GoogleAuthService from '@/services/google-auth.service';

export interface UseEmailAuthOptions {
  onSuccess?: () => void;
  onError?: (error: any) => void;
}

export interface UseEmailAuthResult {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, username?: string) => Promise<void>;
  isLoading: boolean;
}

/**
 * Email/Password Authentication Hook
 */
export const useEmailAuth = (options?: UseEmailAuthOptions): UseEmailAuthResult => {
  const router = useRouter();
  const { refetch } = useGlobalContext();
  const [login, { isLoading: loginLoader }] = useLoginMutation();
  const [register, { isLoading: registerLoader }] = useRegisterMutation();

  const handleLogin = useCallback(
    async (email: string, password: string) => {
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      try {
        Keyboard.dismiss();
        if (Platform.OS !== 'web') {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }

        const resp = await login({ email, password }).unwrap();
        const accessToken = resp?.data?.tokens?.accessToken;

        if (!accessToken) {
          throw new Error('Authentication failed: No access token received');
        }

        await saveToken('token', accessToken);
        await refetch();

        const isOnboarded = resp?.data?.onboardingStatus === true;
        router.replace(isOnboarded ? '/home' : '/onboarding');

        options?.onSuccess?.();
      } catch (error: any) {
        Logger.error('useEmailAuth.login', error);
        options?.onError?.(error);
        throw error;
      }
    },
    [login, refetch, router, options]
  );

  const handleRegister = useCallback(
    async (email: string, password: string, username?: string) => {
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      try {
        if (Platform.OS !== 'web') {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }

        await register({ email, password, username }).unwrap();
        options?.onSuccess?.();
      } catch (error: any) {
        Logger.error('useEmailAuth.register', error);
        options?.onError?.(error);
        throw error;
      }
    },
    [register, options]
  );

  return {
    login: handleLogin,
    register: handleRegister,
    isLoading: loginLoader || registerLoader,
  };
};

export interface UseGoogleAuthResult {
  signIn: () => Promise<void>;
  isLoading: boolean;
}

/**
 * Google Authentication Hook
 */
export const useGoogleAuth = (options?: UseEmailAuthOptions): UseGoogleAuthResult => {
  const router = useRouter();
  const { refetch } = useGlobalContext();
  const [isLoading, setIsLoading] = useState(false);
  const [firebaseExchange, { isLoading: exchangeLoader }] = useFirebaseExchangeMutation();

  const handleGoogleSignIn = useCallback(async () => {
    setIsLoading(true);
    try {
      if (Platform.OS !== 'web') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      // Initialize Google Auth Service on first use
      GoogleAuthService.initialize();

      // Sign in with Google
      const result = await GoogleAuthService.signIn();

      if (!result.idToken) {
        throw new Error('No ID token received from Google');
      }

      // Exchange Firebase token for app JWT
      const resp = await firebaseExchange({ token: result.idToken }).unwrap();
      const accessToken = resp?.data?.tokens?.accessToken;

      if (!accessToken) {
        throw new Error('Authentication failed: No access token received');
      }

      await saveToken('token', accessToken);
      await refetch();

      const isOnboarded = resp?.data?.onboardingStatus === true;
      router.replace(isOnboarded ? '/home' : '/onboarding');

      options?.onSuccess?.();
    } catch (error: any) {
      // Don't show error if user cancelled
      if (!error?.isCancelled) {
        Logger.error('useGoogleAuth.signIn', error);
        options?.onError?.(error);
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [firebaseExchange, refetch, router, options]);

  return {
    signIn: handleGoogleSignIn,
    isLoading: isLoading || exchangeLoader,
  };
};

export interface UseAppleAuthResult {
  signIn: () => Promise<void>;
  isLoading: boolean;
  isAvailable: boolean;
}

/**
 * Apple Authentication Hook (iOS only)
 */
export const useAppleAuth = (options?: UseEmailAuthOptions): UseAppleAuthResult => {
  const router = useRouter();
  const { refetch } = useGlobalContext();
  const [isLoading, setIsLoading] = useState(false);
  const [isAvailable, setIsAvailable] = useState(Platform.OS === 'ios');
  const [firebaseExchange, { isLoading: exchangeLoader }] = useFirebaseExchangeMutation();

  const handleAppleSignIn = useCallback(async () => {
    if (Platform.OS !== 'ios') {
      throw new Error('Apple Sign-In is only available on iOS');
    }

    setIsLoading(true);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const appleRes = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!appleRes.identityToken) {
        throw new Error('Apple Sign-In failed: No identity token received');
      }

      // Exchange with Firebase
      const provider = new OAuthProvider('apple.com');
      const credential = provider.credential({ idToken: appleRes.identityToken });
      const userCred = await signInWithCredential(auth, credential);
      const firebaseIdToken = await userCred.user.getIdToken(true);

      // Exchange for app JWT
      const resp = await firebaseExchange({ token: firebaseIdToken }).unwrap();
      const accessToken = resp?.data?.tokens?.accessToken;

      if (!accessToken) {
        throw new Error('Authentication failed: No access token received');
      }

      await saveToken('token', accessToken);
      await refetch();

      const isOnboarded = resp?.data?.onboardingStatus === true;
      router.replace(isOnboarded ? '/home' : '/onboarding');

      options?.onSuccess?.();
    } catch (error: any) {
      if (error?.code === 'ERR_REQUEST_CANCELED') {
        // User cancelled, don't log error
        return;
      }
      Logger.error('useAppleAuth.signIn', error);
      options?.onError?.(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [firebaseExchange, refetch, router, options]);

  return {
    signIn: handleAppleSignIn,
    isLoading: isLoading || exchangeLoader,
    isAvailable,
  };
};

/**
 * Post-authentication navigation logic
 */
export const useAuthNavigation = () => {
  const router = useRouter();
  const { user } = useGlobalContext();

  const handlePostAuthNavigation = useCallback(
    (isOnboarded: boolean) => {
      router.replace(isOnboarded ? '/home' : '/onboarding');
    },
    [router]
  );

  const redirectIfAuthenticated = useCallback(() => {
    if (!user) return;
    if (user?.data?.onBoarding) {
      router.replace('/home');
    } else {
      router.replace('/onboarding');
    }
  }, [router, user]);

  return {
    handlePostAuthNavigation,
    redirectIfAuthenticated,
  };
};

export default {
  useEmailAuth,
  useGoogleAuth,
  useAppleAuth,
  useAuthNavigation,
};
