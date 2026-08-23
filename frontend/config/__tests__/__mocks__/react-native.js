// Minimal react-native mock for environments.test.ts — only Platform.OS is used
// by the code under test, so this avoids needing the full (currently broken)
// jest-expo/@react-native/jest-preset RN mock stack.
module.exports = {
  Platform: {
    OS: 'web',
  },
};
