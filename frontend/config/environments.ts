// config/environments.ts
import { Platform } from 'react-native';
import apiEndpoints from './api-endpoints.json';

export type Environment = 'langowords' | 'langoprep' | 'ieltscamp' | 'mathmaster' | 'langoreads' | 'langoread' | 'liiro';

export type Target = 'local' | 'dev' | 'prod';

export interface AppConfig {
  name: string;
  displayName: string;
  apiBaseUrl: string;
  scheme: string;
  bundleId: {
    ios: string;
    android: string;
  };
  firebaseProject: string;
  appVersion: string;
}

interface ApiEndpointEntry {
  localPort: number;
  devHost: string;
  prodHost: string;
  apiPath: string;
}

// api-endpoints.json is the single source of truth for backend hosts/ports
const API_ENDPOINTS = apiEndpoints as unknown as Record<Environment, ApiEndpointEntry>;

export function getCurrentEnvironment(): Environment {
  if (typeof window !== 'undefined' && window.location) {
    const hostname = window.location.hostname;
    if (hostname.includes('liiro.io')) return 'liiro';
    if (hostname.includes('langoread.io')) return 'langoreads';
    if (hostname.includes('langoprep.io')) return 'langoprep';
    if (hostname.includes('langowords.io')) return 'langowords';
    if (hostname.includes('ieltscamp.io')) return 'ieltscamp';
  }
  const env = process.env.EXPO_PUBLIC_APP_ENV || process.env.EXPO_PUBLIC_PROJECT_NAME || 'liiro';
  return env as Environment;
}

export function getCurrentTarget(): Target {
  const env = process.env.EXPO_PUBLIC_ENV || process.env.NODE_ENV;
  if (env === 'production') return 'prod';
  if (env === 'development') return 'dev';
  return 'local';
}

function computeDefaultApiUrl(product: Environment, target: Target): string {
  const entry = API_ENDPOINTS[product] || API_ENDPOINTS.langowords;
  if (target === 'local') {
    return `http://localhost:${entry.localPort}/api/v1`;
  }
  const host = target === 'prod' ? entry.prodHost : entry.devHost;
  return `https://${host}/${entry.apiPath}/api/v1`;
}

function resolveHostForPlatform(url: string): string {
  const isLocalhost = url.includes('localhost') || url.includes('127.0.0.1');
  if (!isLocalhost) return url;

  const lanIp = process.env.EXPO_PUBLIC_LOCAL_LAN_IP;
  if (lanIp) {
    const rewritten = url.replace('localhost', lanIp).replace('127.0.0.1', lanIp);
    console.log('✅ Adapted localhost to LAN IP for physical device:', rewritten);
    return rewritten;
  }

  if (Platform.OS === 'android') {
    const rewritten = url.replace('localhost', '10.0.2.2').replace('127.0.0.1', '10.0.2.2');
    console.log('✅ Adapted localhost to 10.0.2.2 for Android emulator:', rewritten);
    return rewritten;
  }

  return url;
}

export function getLandingPageUrl(): string {
  if (typeof window !== 'undefined' && window.location) {
    const hostname = window.location.hostname;
    if (hostname.includes('dev.app.langowords.io')) return 'https://dev.langowords.io';
    if (hostname.includes('dev.app.langoprep.io')) return 'https://dev.langoprep.io';
    if (hostname.includes('dev.app.langoread.io')) return 'https://dev.langoread.io';
    if (hostname.includes('app.langowords.io')) return 'https://langowords.io';
    if (hostname.includes('app.langoprep.io')) return 'https://langoprep.io';
    if (hostname.includes('app.langoread.io')) return 'https://langoread.io';
    if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) return window.location.origin;
  }
  const appEnv = getCurrentEnvironment();
  if (appEnv === 'langoprep') return 'https://langoprep.io';
  if (appEnv === 'ieltscamp') return 'https://ieltscamp.io';
  if (appEnv === 'mathmaster') return 'https://mathmaster.io';
  if (appEnv === 'langoreads' || appEnv === 'langoread') return 'https://langoread.io';
  return 'https://langowords.io';
}

export function getApiBaseUrl(): string {
  const explicitUrl = process.env.EXPO_PUBLIC_API_URL;
  if (explicitUrl) {
    const resolved = resolveHostForPlatform(explicitUrl);
    if (resolved === explicitUrl) {
      console.log('✅ Using custom API URL from EXPO_PUBLIC_API_URL:', resolved);
    }
    return resolved;
  }

  const product = getCurrentEnvironment();
  const target = getCurrentTarget();
  const defaultUrl = resolveHostForPlatform(computeDefaultApiUrl(product, target));
  console.log(`ℹ️ Using default API URL for ${product} (${target}):`, defaultUrl);
  return defaultUrl;
}

const isDev = process.env.EXPO_PUBLIC_ENV === 'production' ? false : ((typeof __DEV__ !== 'undefined' && __DEV__) || process.env.EXPO_PUBLIC_ENV === 'development');

const ENVIRONMENTS: Record<Environment, AppConfig> = {
  langowords: {
    name: 'LangoWords',
    displayName: 'LangoWords',
    apiBaseUrl: 'PLACEHOLDER',
    scheme: 'langowords',
    bundleId: { ios: 'com.aiopscamp.langowords', android: 'com.aiopscamp.langowords' },
    firebaseProject: isDev ? 'langowords-dev' : 'langowords-prod',
    appVersion: '1.0.0'
  },
  langoprep: {
    name: 'LangoPrep',
    displayName: 'LangoPrep',
    apiBaseUrl: 'PLACEHOLDER',
    scheme: 'langoprep',
    bundleId: { ios: 'com.aiopscamp.langoprep', android: 'com.aiopscamp.langoprep' },
    firebaseProject: 'langoprep-prod',
    appVersion: '0.0.02'
  },
  ieltscamp: {
    name: 'IeltsCamp',
    displayName: 'IeltsCamp',
    apiBaseUrl: 'PLACEHOLDER',
    scheme: 'ieltscamp',
    bundleId: { ios: 'com.aiopscamp.ieltscamp', android: 'com.aiopscamp.ieltscamp' },
    firebaseProject: 'ieltscamp-prod',
    appVersion: '1.0.0'
  },
  mathmaster: {
    name: 'MathMaster',
    displayName: 'MathMaster',
    apiBaseUrl: 'PLACEHOLDER',
    scheme: 'mathmaster',
    bundleId: { ios: 'com.aiopscamp.mathmaster', android: 'com.aiopscamp.mathmaster' },
    firebaseProject: 'mathmaster-prod',
    appVersion: '1.0.0'
  },
  langoread: {
    name: 'LangoRead',
    displayName: 'LangoRead',
    apiBaseUrl: 'PLACEHOLDER',
    scheme: 'langoread',
    bundleId: { ios: 'com.aiopscamp.langoread', android: 'com.aiopscamp.langoread' },
    firebaseProject: 'langoreads',
    appVersion: '1.0.0'
  },
  langoreads: {
    name: 'LangoRead',
    displayName: 'LangoRead',
    apiBaseUrl: 'PLACEHOLDER',
    scheme: 'langoread',
    bundleId: { ios: 'com.aiopscamp.langoread', android: 'com.aiopscamp.langoread' },
    firebaseProject: 'langoreads',
    appVersion: '1.0.0'
  },
  liiro: {
    name: 'Liiro',
    displayName: 'Liiro',
    apiBaseUrl: 'PLACEHOLDER',
    scheme: 'liiro',
    bundleId: { ios: 'com.aiopscamp.liiro', android: 'com.aiopscamp.liiro' },
    firebaseProject: 'langoreads',
    appVersion: '1.0.0'
  }
};

export function getConfig(environment: Environment = getCurrentEnvironment()): AppConfig {
  const config = ENVIRONMENTS[environment] || ENVIRONMENTS.langowords;
  return {
    ...config,
    apiBaseUrl: getApiBaseUrl(),
  };
}

export const config = getConfig(getCurrentEnvironment());
export default config;
