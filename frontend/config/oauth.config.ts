/**
 * OAuth Configuration - App-Specific
 * Centralized OAuth credentials and settings per app variant
 * 
 * NOTE: Web Client IDs are public and safe to commit.
 * Guard API keys and secrets in environment variables.
 */

import { Platform } from 'react-native';
import { getBranding } from './branding';

export interface OAuthConfig {
  google: {
    webClientId: string;
    iosClientId?: string;
    androidClientId?: string;
    offlineAccess: boolean;
    forceCodeForRefreshToken: boolean;
    scopes: string[];
    profileImageSize?: number;
  };
  apple?: {
    enabled: boolean;
  };
}

/**
 * Per-app OAuth configurations
 */
const isDev = process.env.EXPO_PUBLIC_ENV === 'production' ? false : ((typeof __DEV__ !== 'undefined' && __DEV__) || process.env.EXPO_PUBLIC_ENV === 'development');

const OAUTH_CONFIGS: Record<string, OAuthConfig> = {
  langowords: {
    google: {
      // LangoWords Google OAuth credentials
      // Dev  → langowords-dev project (65279033083)
      // Prod → langowords project     (163716658400)
      webClientId: isDev
        ? '65279033083-gocdbi2h0f9v4tifpublstvtsbla725o.apps.googleusercontent.com'
        : '163716658400-7i23ki0iu7l2co7qpe93ouhv31dlood0.apps.googleusercontent.com',
      // iosClientId must be in the SAME Firebase project as webClientId, or native Google
      // Sign-In fails with "invalid_audience: the audience client and the client need to
      // be in the same project." Source: CLIENT_ID field in GoogleService-Info.langowords.dev.plist
      // vs GoogleService-Info.langowords.plist — these are NOT the same value.
      iosClientId: isDev
        ? '65279033083-rl2f4elhrp5cf9u85a92gd0rgii4dgnr.apps.googleusercontent.com'
        : '163716658400-uaujqm207mpjb5brdqrismb6u35937av.apps.googleusercontent.com',
      // androidClientId left undefined — native SDK resolves via google-services.json
      androidClientId: undefined,
      offlineAccess: true,
      forceCodeForRefreshToken: true,
      scopes: ['profile', 'email'],
      profileImageSize: 120,
    },
    apple: {
      enabled: true,
    },
  },
  langoprep: {
    google: {
      // NOTE: webClientId switches dev/prod, but iosClientId/androidClientId below are
      // always the prod project (325684657066) — same "invalid_audience" risk fixed for
      // langowords above. No dev GoogleService-Info/google-services file exists for
      // langoprep to source a real dev iosClientId/androidClientId from — provision a
      // langoprep-dev Firebase project (or confirm none is needed) before fixing this.
      webClientId: isDev
        ? '178526207922-s0jco2q8bhh854os8vv9g9a9h5asckao.apps.googleusercontent.com'
        : '325684657066-df1m2ih9hjo970as41clalpnbdm484fm.apps.googleusercontent.com',
      iosClientId: '325684657066-df1m2ih9hjo970as41clalpnbdm484fm.apps.googleusercontent.com',
      androidClientId: '325684657066-df1m2ih9hjo970as41clalpnbdm484fm.apps.googleusercontent.com',
      offlineAccess: true,
      forceCodeForRefreshToken: true,
      scopes: ['profile', 'email'],
      profileImageSize: 120,
    },
    apple: {
      enabled: true,
    },
  },
  ieltscamp: {
    google: {
      // IeltsCamp Google OAuth credentials
      webClientId: '325684657066-xweb1m2ih9hjo970as41clalpnbdm484fm.apps.googleusercontent.com',
      iosClientId: '325684657066-xios1m2ih9hjo970as41clalpnbdm484fm.apps.googleusercontent.com',
      androidClientId: '325684657066-xand1m2ih9hjo970as41clalpnbdm484fm.apps.googleusercontent.com',
      offlineAccess: true,
      forceCodeForRefreshToken: true,
      scopes: ['profile', 'email'],
      profileImageSize: 120,
    },
    apple: {
      enabled: true,
    },
  },
  mathmaster: {
    google: {
      webClientId: '000000000000-xweb1m2ih9hjo970as41clalpnbdm484fm.apps.googleusercontent.com',
      iosClientId: '000000000000-xios1m2ih9hjo970as41clalpnbdm484fm.apps.googleusercontent.com',
      androidClientId: '000000000000-xand1m2ih9hjo970as41clalpnbdm484fm.apps.googleusercontent.com',
      offlineAccess: true,
      forceCodeForRefreshToken: true,
      scopes: ['profile', 'email'],
      profileImageSize: 120,
    },
    apple: {
      enabled: true,
    },
  },
  langoread: {
    google: {
      webClientId: '1063007373821-vj9qduta1qlfogj0i3bgm9d4vdae85gp.apps.googleusercontent.com',
      iosClientId: '1063007373821-jbre7dqqsje1vj1adrl0a5p78golo10g.apps.googleusercontent.com',
      offlineAccess: true,
      forceCodeForRefreshToken: true,
      scopes: ['profile', 'email'],
      profileImageSize: 120,
    },
    apple: {
      enabled: true,
    },
  },
  langoreads: {
    google: {
      webClientId: '1063007373821-vj9qduta1qlfogj0i3bgm9d4vdae85gp.apps.googleusercontent.com',
      iosClientId: '1063007373821-jbre7dqqsje1vj1adrl0a5p78golo10g.apps.googleusercontent.com',
      offlineAccess: true,
      forceCodeForRefreshToken: true,
      scopes: ['profile', 'email'],
      profileImageSize: 120,
    },
    apple: {
      enabled: true,
    },
  },
};

/**
 * Get OAuth configuration for current app variant
 */
export function getOAuthConfig(): OAuthConfig {
  const branding = getBranding();
  const config = OAUTH_CONFIGS[branding.appName.toLowerCase()];

  if (!config) {
    throw new Error(
      `OAuth config not found for app: ${branding.appName.toLowerCase()}. ` +
      `Please ensure the app name is configured in OAUTH_CONFIGS.`
    );
  }

  return config;
}

/**
 * Get app-specific Google OAuth web client ID
 */
export function getGoogleWebClientId(): string {
  return getOAuthConfig().google.webClientId;
}

/**
 * Get app-specific Google OAuth configuration for native platforms
 */
export function getGoogleNativeConfig() {
  const config = getOAuthConfig().google;
  const nativeConfig: any = {
    webClientId: config.webClientId,
    iosClientId: config.iosClientId,
    offlineAccess: config.offlineAccess,
    forceCodeForRefreshToken: config.forceCodeForRefreshToken,
  };

  // Passing profileImageSize on Android forces a fallback to the legacy Google Sign-In prompt.
  // By omitting it on Android, we enable the modern Credential Manager / One Tap bottom sheet.
  if (Platform.OS === "ios" && config.profileImageSize) {
    nativeConfig.profileImageSize = config.profileImageSize;
  }

  return nativeConfig;
}

export default OAUTH_CONFIGS;
