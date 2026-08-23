const ORIGINAL_ENV = { ...process.env };
let currentPlatformOS = 'web';

function resetEnv() {
  process.env = { ...ORIGINAL_ENV };
  delete process.env.EXPO_PUBLIC_API_URL;
  delete process.env.EXPO_PUBLIC_APP_ENV;
  delete process.env.EXPO_PUBLIC_ENV;
  delete process.env.EXPO_PUBLIC_LOCAL_LAN_IP;
  delete process.env.NODE_ENV;
  currentPlatformOS = 'web';
}

function setPlatformOS(os: string) {
  currentPlatformOS = os;
}

function loadEnvironments() {
  // environments.ts computes `config` at module scope from whatever env vars are
  // set at import time, so re-require it fresh inside each test after setting env.
  // Must also require('react-native') and set Platform.OS INSIDE the same
  // isolateModules callback — otherwise the isolated registry gives
  // environments.ts a fresh, unmutated mock instance instead of the one this
  // test file mutated at module scope.
  let mod: typeof import('../environments');
  jest.isolateModules(() => {
    const { Platform } = require('react-native');
    Platform.OS = currentPlatformOS;
    mod = require('../environments');
  });
  return mod!;
}

describe('getApiBaseUrl — matrix defaults (no explicit override)', () => {
  beforeEach(() => {
    resetEnv();
    setPlatformOS('web');
  });

  const cases: Array<[string, string | undefined, string]> = [
    ['langowords', undefined, 'http://localhost:5005/api/v1'],
    ['langowords', 'development', 'https://dev.app.langowords.io/aiopscamp-langowords-api/api/v1'],
    ['langowords', 'production', 'https://app.langowords.io/aiopscamp-langowords-api/api/v1'],
    ['langoprep', undefined, 'http://localhost:5006/api/v1'],
    ['langoprep', 'development', 'https://dev.app.langoprep.io/aiopscamp-langoprep-api/api/v1'],
    ['langoprep', 'production', 'https://app.langoprep.io/aiopscamp-langoprep-api/api/v1'],
    ['langoreads', undefined, 'http://localhost:5011/api/v1'],
    ['langoreads', 'development', 'https://dev.app.langoread.io/aiopscamp-langoreads-api/api/v1'],
    ['langoreads', 'production', 'https://app.langoread.io/aiopscamp-langoreads-api/api/v1'],
    ['langoread', undefined, 'http://localhost:5011/api/v1'],
    ['langoread', 'development', 'https://dev.app.langoread.io/aiopscamp-langoreads-api/api/v1'],
    ['langoread', 'production', 'https://app.langoread.io/aiopscamp-langoreads-api/api/v1'],
    ['ieltscamp', undefined, 'http://localhost:5005/api/v1'],
    ['ieltscamp', 'development', 'https://dev.app.langowords.io/aiopscamp-langowords-api/api/v1'],
    ['ieltscamp', 'production', 'https://app.langowords.io/aiopscamp-langowords-api/api/v1'],
    ['mathmaster', undefined, 'http://localhost:5005/api/v1'],
    ['mathmaster', 'development', 'https://dev.app.langowords.io/aiopscamp-langowords-api/api/v1'],
    // mathmaster is unlaunched — "production" deliberately resolves to the dev host, never real prod.
    ['mathmaster', 'production', 'https://dev.app.langowords.io/aiopscamp-langowords-api/api/v1'],
  ];

  for (const [product, expoEnv, expected] of cases) {
    const label = expoEnv ?? 'local';
    it(`${product} / ${label} -> ${expected}`, () => {
      process.env.EXPO_PUBLIC_APP_ENV = product;
      if (expoEnv) process.env.EXPO_PUBLIC_ENV = expoEnv;
      const { getApiBaseUrl } = loadEnvironments();
      expect(getApiBaseUrl()).toBe(expected);
    });
  }
});

describe('getApiBaseUrl — explicit EXPO_PUBLIC_API_URL override', () => {
  beforeEach(() => {
    resetEnv();
    setPlatformOS('web');
  });

  it('always wins over the matrix default', () => {
    process.env.EXPO_PUBLIC_APP_ENV = 'langowords';
    process.env.EXPO_PUBLIC_ENV = 'production';
    process.env.EXPO_PUBLIC_API_URL = 'http://localhost:9999/api/v1';
    const { getApiBaseUrl } = loadEnvironments();
    // web platform, no LAN IP set -> localhost passes through untouched
    expect(getApiBaseUrl()).toBe('http://localhost:9999/api/v1');
  });
});

describe('resolveHostForPlatform — Android emulator + LAN IP rewrite', () => {
  beforeEach(() => {
    resetEnv();
    process.env.EXPO_PUBLIC_APP_ENV = 'langowords';
  });

  it('rewrites localhost to 10.0.2.2 on Android with no LAN IP set', () => {
    setPlatformOS('android');
    const { getApiBaseUrl } = loadEnvironments();
    expect(getApiBaseUrl()).toBe('http://10.0.2.2:5005/api/v1');
  });

  it('leaves localhost untouched on iOS simulator', () => {
    setPlatformOS('ios');
    const { getApiBaseUrl } = loadEnvironments();
    expect(getApiBaseUrl()).toBe('http://localhost:5005/api/v1');
  });

  it('leaves localhost untouched on web', () => {
    setPlatformOS('web');
    const { getApiBaseUrl } = loadEnvironments();
    expect(getApiBaseUrl()).toBe('http://localhost:5005/api/v1');
  });

  it('EXPO_PUBLIC_LOCAL_LAN_IP overrides the Android 10.0.2.2 default (physical device)', () => {
    setPlatformOS('android');
    process.env.EXPO_PUBLIC_LOCAL_LAN_IP = '192.168.1.50';
    const { getApiBaseUrl } = loadEnvironments();
    expect(getApiBaseUrl()).toBe('http://192.168.1.50:5005/api/v1');
  });

  it('EXPO_PUBLIC_LOCAL_LAN_IP applies on iOS too (physical device)', () => {
    setPlatformOS('ios');
    process.env.EXPO_PUBLIC_LOCAL_LAN_IP = '192.168.1.50';
    const { getApiBaseUrl } = loadEnvironments();
    expect(getApiBaseUrl()).toBe('http://192.168.1.50:5005/api/v1');
  });

  it('does not touch a non-localhost URL regardless of platform', () => {
    setPlatformOS('android');
    process.env.EXPO_PUBLIC_ENV = 'production';
    const { getApiBaseUrl } = loadEnvironments();
    expect(getApiBaseUrl()).toBe('https://app.langowords.io/aiopscamp-langowords-api/api/v1');
  });
});

describe('getCurrentTarget', () => {
  beforeEach(() => resetEnv());

  it('defaults to local', () => {
    const { getCurrentTarget } = loadEnvironments();
    expect(getCurrentTarget()).toBe('local');
  });

  it('maps EXPO_PUBLIC_ENV=development to dev', () => {
    process.env.EXPO_PUBLIC_ENV = 'development';
    const { getCurrentTarget } = loadEnvironments();
    expect(getCurrentTarget()).toBe('dev');
  });

  it('maps EXPO_PUBLIC_ENV=production to prod', () => {
    process.env.EXPO_PUBLIC_ENV = 'production';
    const { getCurrentTarget } = loadEnvironments();
    expect(getCurrentTarget()).toBe('prod');
  });

  it('falls back to NODE_ENV when EXPO_PUBLIC_ENV is unset', () => {
    process.env.NODE_ENV = 'production';
    const { getCurrentTarget } = loadEnvironments();
    expect(getCurrentTarget()).toBe('prod');
  });
});
