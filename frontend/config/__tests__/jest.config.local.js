// Standalone Jest config for config/__tests__/environments.test.ts only.
// The project's root jest-expo preset is currently broken (missing peer dep
// @react-native/jest-preset — pre-existing, unrelated to this test), so this
// config avoids it entirely: babel-jest transform via the project's own
// babel.config.js, plus a minimal react-native mock (Platform.OS only, which
// is all this test needs).
module.exports = {
  rootDir: '../../',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/config/__tests__/environments.test.ts'],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  // babel-preset-expo rewrites process.env.EXPO_PUBLIC_* into an import from the
  // (ESM) expo/virtual/env module — node_modules is untransformed by default, so
  // that import needs to pass through the transform too.
  transformIgnorePatterns: ['node_modules/(?!(expo)/)'],
  moduleNameMapper: {
    '^react-native$': '<rootDir>/config/__tests__/__mocks__/react-native.js',
  },
};
