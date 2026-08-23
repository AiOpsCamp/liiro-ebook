// config/api.ts
import { config, getApiBaseUrl } from './environments';

export class ApiConfig {
  static getBaseUrl(): string {
    // Call getApiBaseUrl() at runtime to pick up env vars
    return getApiBaseUrl();
  }

  static getFullUrl(endpoint: string): string {
    return `${this.getBaseUrl()}${endpoint}`;
  }

  static getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'X-App': config.name,
      'X-App-Version': config.appVersion,
    };
  }

  static getAppName(): string {
    return config.displayName;
  }

  static getScheme(): string {
    return config.scheme;
  }

  static getBundleId(platform: 'ios' | 'android'): string {
    return config.bundleId[platform];
  }

  static getFirebaseProject(): string {
    return config.firebaseProject;
  }
}

export default ApiConfig;
