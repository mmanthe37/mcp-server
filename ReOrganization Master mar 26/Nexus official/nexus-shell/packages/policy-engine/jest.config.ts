import type { Config } from 'jest';

const config: Config = {
  displayName: 'policy-engine',
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: ['<rootDir>/src/**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^@nexus-shell/(.*)$': '<rootDir>/../$1/src',
  },
};

export default config;
