/**
 * Firebase Configuration - Environment-Aware
 * Provides app-specific Firebase credentials based on EXPO_PUBLIC_APP_ENV
 */

import { getBranding } from './branding';
import { getCurrentEnvironment } from './environments';

export interface FirebaseConfig {
  projectId: string;
  apiKey: string;
  authDomain: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

/**
 * Per-app Firebase configurations
 */
const isDev = process.env.EXPO_PUBLIC_ENV === 'production' ? false : ((typeof __DEV__ !== 'undefined' && __DEV__) || process.env.EXPO_PUBLIC_ENV === 'development');

export interface FirebaseEnvConfig {
  dev: FirebaseConfig;
  prod: FirebaseConfig;
}

const FIREBASE_CONFIGS: Record<string, FirebaseConfig | FirebaseEnvConfig> = {
  liiro: {
    projectId: "liiro-ebook",
    apiKey: "AIzaSyDxRYveA9twmg2IX71NZGuYM7CvFuMILHI",
    authDomain: "liiro-ebook.firebaseapp.com",
    storageBucket: "liiro-ebook.firebasestorage.app",
    messagingSenderId: "925002930635",
    appId: "1:925002930635:web:1bd2761216b68243a2fe4e",
  },
  langowords: {
    dev: {
      // langowords-dev Firebase project (65279033083)
      projectId: 'langowords-dev',
      apiKey: 'AIzaSyDiWJQvlEa-yWfahU33WzAnTcCUXVTRx6o',
      authDomain: 'dev.langowords.io',
      storageBucket: 'langowords-dev.firebasestorage.app',
      messagingSenderId: '65279033083',
      appId: '1:65279033083:web:d51272451ba3b896e1fa5e',
    },
    prod: {
      projectId: 'langowords',
      apiKey: 'AIzaSyCZhSVLqU5oQMS_TYG4MYlMPgiMwhnUrps',
      authDomain: 'langowords.io',
      storageBucket: 'langowords.firebasestorage.app',
      messagingSenderId: '163716658400',
      appId: '1:163716658400:web:2ee54bfc0dadf6b6424c85',
    }
  },
  langoprep: {
    dev: {
      projectId: 'langoprep-dev',
      apiKey: 'AIzaSyBlpVa40-7-Z7H6d1xAp-TmaFsn6N_X7Dk',
      authDomain: 'dev.langoprep.io',
      storageBucket: 'langoprep-dev.firebasestorage.app',
      messagingSenderId: '178526207922',
      appId: '1:178526207922:web:8010813fb84d5194ebaeab',
    },
    prod: {
      projectId: 'langoprep',
      apiKey: 'AIzaSyDtsHldboI0Fs7dIjIJQTXnYLxH4UofhQo',
      authDomain: 'langoprep.io',
      storageBucket: 'langoprep.firebasestorage.app',
      messagingSenderId: '325684657066',
      appId: '1:325684657066:web:bc8058dada8ff2f3ff49d3',
    }
  },
  ieltscamp: {
    projectId: 'ieltscamp',
    apiKey: 'AIzaSyDtsHldboI0Fs7dIjIJQTXnYLxH4UofhQo',
    authDomain: 'ieltscamp.firebaseapp.com',
    storageBucket: 'ieltscamp.firebasestorage.app',
    messagingSenderId: '325684657066',
    appId: '1:325684657066:web:bc8058dada8ff2f3ff49d3',
  },
  mathmaster: {
    projectId: 'mathmaster-placeholder',
    apiKey: 'MATHMASTER_PLACEHOLDER_KEY',
    authDomain: 'mathmaster.firebaseapp.com',
    storageBucket: 'mathmaster.firebasestorage.app',
    messagingSenderId: '0000000000',
    appId: '1:0000000000:web:0000000000',
  },
  langoread: {
    dev: {
      projectId: 'langoreads',
      apiKey: 'AIzaSyDgTMlNBfR5k2Xb972yul9VRKdMu11RBNQ',
      authDomain: 'langoreads.firebaseapp.com',
      storageBucket: 'langoreads.firebasestorage.app',
      messagingSenderId: '1063007373821',
      appId: '1:1063007373821:web:7f6d2e825a09b3a29a3194',
    },
    prod: {
      projectId: 'langoreads',
      apiKey: 'AIzaSyDgTMlNBfR5k2Xb972yul9VRKdMu11RBNQ',
      authDomain: 'langoreads.firebaseapp.com',
      storageBucket: 'langoreads.firebasestorage.app',
      messagingSenderId: '1063007373821',
      appId: '1:1063007373821:web:7f6d2e825a09b3a29a3194',
    }
  },
  langoreads: {
    dev: {
      projectId: 'langoreads',
      apiKey: 'AIzaSyDgTMlNBfR5k2Xb972yul9VRKdMu11RBNQ',
      authDomain: 'langoreads.firebaseapp.com',
      storageBucket: 'langoreads.firebasestorage.app',
      messagingSenderId: '1063007373821',
      appId: '1:1063007373821:web:7f6d2e825a09b3a29a3194',
    },
    prod: {
      projectId: 'langoreads',
      apiKey: 'AIzaSyDgTMlNBfR5k2Xb972yul9VRKdMu11RBNQ',
      authDomain: 'langoreads.firebaseapp.com',
      storageBucket: 'langoreads.firebasestorage.app',
      messagingSenderId: '1063007373821',
      appId: '1:1063007373821:web:7f6d2e825a09b3a29a3194',
    }
  },
  liiro: {
    dev: {
      projectId: 'langoreads',
      apiKey: 'AIzaSyDgTMlNBfR5k2Xb972yul9VRKdMu11RBNQ',
      authDomain: 'langoreads.firebaseapp.com',
      storageBucket: 'langoreads.firebasestorage.app',
      messagingSenderId: '1063007373821',
      appId: '1:1063007373821:web:7f6d2e825a09b3a29a3194',
    },
    prod: {
      projectId: 'langoreads',
      apiKey: 'AIzaSyDgTMlNBfR5k2Xb972yul9VRKdMu11RBNQ',
      authDomain: 'langoreads.firebaseapp.com',
      storageBucket: 'langoreads.firebasestorage.app',
      messagingSenderId: '1063007373821',
      appId: '1:1063007373821:web:7f6d2e825a09b3a29a3194',
    }
  },
};

/**
 * Get Firebase configuration for current app variant
 */
export function getFirebaseConfig(appNameOverride?: string): FirebaseConfig {
  const appEnv = appNameOverride || process.env.EXPO_PUBLIC_APP_ENV || getBranding().appName;
  let rawConfig = FIREBASE_CONFIGS[appEnv] || FIREBASE_CONFIGS.langowords;
  const hasDevProdSplit = !!rawConfig && 'dev' in rawConfig && 'prod' in rawConfig;

  // 1. When this app has a dev/prod split AND the environment was explicitly
  //    requested (EXPO_PUBLIC_ENV=development|production, e.g. by the
  //    web-local-prod-*/web-local-dev-* npm scripts), honor that choice over any
  //    raw EXPO_PUBLIC_FIREBASE_* vars. Those vars live in the shared root .env
  //    as dev-only convenience defaults and must never leak into a prod run —
  //    that's exactly how Google Sign-In ended up hitting the dev Firebase
  //    project even when running "in production mode" locally.
  if (hasDevProdSplit && process.env.EXPO_PUBLIC_ENV) {
    return isDev ? (rawConfig as FirebaseEnvConfig).dev : (rawConfig as FirebaseEnvConfig).prod;
  }

  // 2. Otherwise prefer explicitly defined environment variables if available
  //    (used by apps/build profiles that inject Firebase config directly).
  if (process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID) {
    return {
      projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
      apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || '',
      authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
      storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
      messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '',
    };
  }

  // 3. Fallback to default dictionary for apps not explicitly in dictionary
  if (!rawConfig) {
    rawConfig = FIREBASE_CONFIGS.liiro;
  }

  if (hasDevProdSplit) {
    return isDev ? (rawConfig as FirebaseEnvConfig).dev : (rawConfig as FirebaseEnvConfig).prod;
  }

  return rawConfig as FirebaseConfig;
}

/**
 * Convenience exports for individual values
 */
export function getFirebaseProjectId(): string {
  return getFirebaseConfig().projectId;
}

export function getFirebaseAuthDomain(): string {
  return getFirebaseConfig().authDomain;
}
