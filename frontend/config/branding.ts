// config/branding.ts
// Dynamic app branding configuration
// Centralized source for all app-specific branding elements

import { getCurrentEnvironment } from './environments';

export interface BrandingConfig {
  appName: string;
  displayName: string;
  appTitle: string;
  companyName: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  assets: {
    logoPath: string;
    iconPath: string;
    splashPath: string;
    favicon: string;
  };
  urls: {
    privacyPolicy: string;
    termsOfService: string;
    website: string;
    supportEmail: string;
  };
}

// Branding definitions for each app
const BRANDING_CONFIG: Record<string, BrandingConfig> = {
  langowords: {
    appName: 'LangoWords',
    displayName: 'LangoWords',
    appTitle: 'LangoWords • Learn Languages Fast',
    companyName: 'LangoWords Inc.',
    colors: {
      primary: '#6366F1',        // Indigo (learning-focused)
      secondary: '#8B5CF6',      // Purple
      accent: '#06B6D4',         // Cyan (energetic)
    },
    assets: {
      logoPath: '@/assets/images/logo-langowords.png',
      iconPath: '@/assets/images/icon-langowords.png',
      splashPath: '@/assets/images/splash-langowords.png',
      favicon: '@/assets/images/favicon-langowords.png',
    },
    urls: {
      privacyPolicy: 'https://langowords.io/privacy',
      termsOfService: 'https://langowords.io/terms',
      website: 'https://langowords.io',
      supportEmail: 'support@langowords.io',
    },
  },
  langoprep: {
    appName: 'LangoPrep',
    displayName: 'LangoPrep',
    appTitle: 'LangoPrep • Exam Preparation',
    companyName: 'LangoPrep Inc.',
    colors: {
      primary: '#7C4DFF',        // Purple (authoritative)
      secondary: '#9C8DFF',      // Light Purple
      accent: '#FF8B5A',         // Orange (warm, friendly)
    },
    assets: {
      logoPath: '@/assets/images/logo-langoprep.png',
      iconPath: '@/assets/images/icon-langoprep.png',
      splashPath: '@/assets/images/splash-langoprep.png',
      favicon: '@/assets/images/favicon-langoprep.png',
    },
    urls: {
      privacyPolicy: 'https://langoprep.io/privacy',
      termsOfService: 'https://langoprep.io/terms',
      website: 'https://langoprep.io',
      supportEmail: 'support@langoprep.io',
    },
  },
  ieltscamp: {
    appName: 'IeltsCamp',
    displayName: 'IeltsCamp',
    appTitle: 'IeltsCamp • IELTS Exam Preparation',
    companyName: 'IeltsCamp Inc.',
    colors: {
      primary: '#00BFFF',        // Deep Sky Blue
      secondary: '#00E5FF',      // Secondary Cyan
      accent: '#FF8B5A',         // Accent
    },
    assets: {
      logoPath: '@/assets/images/logo-ieltscamp.png',
      iconPath: '@/assets/images/icon-ieltscamp.png',
      splashPath: '@/assets/images/splash-ieltscamp.png',
      favicon: '@/assets/images/favicon-ieltscamp.png',
    },
    urls: {
      privacyPolicy: 'https://ieltscamp.io/privacy',
      termsOfService: 'https://ieltscamp.io/terms',
      website: 'https://ieltscamp.io',
      supportEmail: 'support@ieltscamp.io',
    },
  },
  mathmaster: {
    appName: 'MathMaster',
    displayName: 'MathMaster',
    appTitle: 'MathMaster • Master Math Quickly',
    companyName: 'MathMaster Inc.',
    colors: {
      primary: '#BBD5DA',        // Soft Teal
      secondary: '#82A1A8',      // Darker Teal
      accent: '#6366F1',         // Indigo
    },
    assets: {
      logoPath: '@/assets/images/logo-langowords.png',
      iconPath: '@/assets/images/icon-langowords.png',
      splashPath: '@/assets/images/splash-langowords.png',
      favicon: '@/assets/images/favicon-langowords.png',
    },
    urls: {
      privacyPolicy: 'https://mathmaster.io/privacy',
      termsOfService: 'https://mathmaster.io/terms',
      website: 'https://mathmaster.io',
      supportEmail: 'support@mathmaster.io',
    },
  },
  langoread: {
    appName: 'LangoRead',
    displayName: 'LangoRead',
    appTitle: 'LangoRead • Master Reading Comprehension',
    companyName: 'LangoRead Inc.',
    colors: {
      primary: '#10B981',        // Emerald Green
      secondary: '#34D399',      // Light Green
      accent: '#3B82F6',         // Blue
    },
    assets: {
      logoPath: '@/assets/langoread/icon.png',
      iconPath: '@/assets/langoread/icon.png',
      splashPath: '@/assets/langoread/splash.png',
      favicon: '@/assets/langoread/favicon.png',
    },
    urls: {
      privacyPolicy: 'https://langoread.io/privacy',
      termsOfService: 'https://langoread.io/terms',
      website: 'https://langoread.io',
      supportEmail: 'support@langoread.io',
    },
  },
  langoreads: {
    appName: 'LangoRead',
    displayName: 'LangoRead',
    appTitle: 'LangoRead • Master Reading Comprehension',
    companyName: 'LangoRead Inc.',
    colors: {
      primary: '#10B981',        // Emerald Green
      secondary: '#34D399',      // Light Green
      accent: '#3B82F6',         // Blue
    },
    assets: {
      logoPath: '@/assets/langoread/icon.png',
      iconPath: '@/assets/langoread/icon.png',
      splashPath: '@/assets/langoread/splash.png',
      favicon: '@/assets/langoread/favicon.png',
    },
    urls: {
      privacyPolicy: 'https://langoread.io/privacy',
      termsOfService: 'https://langoread.io/terms',
      website: 'https://langoread.io',
      supportEmail: 'support@langoread.io',
    },
  },
  liiro: {
    appName: 'Liiro',
    displayName: 'Liiro',
    appTitle: 'Liiro • Master Reading Comprehension',
    companyName: 'Liiro Inc.',
    colors: {
      primary: '#10B981',        // Emerald Green
      secondary: '#34D399',      // Light Green
      accent: '#3B82F6',         // Blue
    },
    assets: {
      logoPath: '@/assets/langoread/icon.png',
      iconPath: '@/assets/langoread/icon.png',
      splashPath: '@/assets/langoread/splash.png',
      favicon: '@/assets/langoread/favicon.png',
    },
    urls: {
      privacyPolicy: 'https://liiro.io/privacy',
      termsOfService: 'https://liiro.io/terms',
      website: 'https://liiro.io',
      supportEmail: 'support@liiro.io',
    },
  },
};

// Get current branding based on environment
export function getBranding(): BrandingConfig {
  const currentEnv = getCurrentEnvironment();
  return BRANDING_CONFIG[currentEnv] || BRANDING_CONFIG.liiro;
}

// Export branding instance
export const branding = getBranding();

// Convenience exports
export const APP_NAME = branding.appName;
export const APP_TITLE = branding.appTitle;
export const COMPANY_NAME = branding.companyName;
export const BRANDING_COLORS = branding.colors;
export const BRANDING_ASSETS = branding.assets;
export const BRANDING_URLS = branding.urls;

export default branding;
