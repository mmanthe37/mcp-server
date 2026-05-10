import type { Config } from 'jest';

const config: Config = {
  displayName: 'server',
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: ['<rootDir>/src/**/__tests__/**/*.test.ts', '<rootDir>/test/**/*.test.ts'],
  moduleNameMapper: {
    '^@nexus-shell/(.*)$': '<rootDir>/../packages/$1/src',
  },
};

export default config;
