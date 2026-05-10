import type { Config } from 'jest';

const config: Config = {
  projects: [
    '<rootDir>/packages/terminal-parser',
    '<rootDir>/packages/policy-engine',
    '<rootDir>/packages/nexusflow-protocol',
    '<rootDir>/packages/ai-models',
    '<rootDir>/server',
  ],
  coverageDirectory: '<rootDir>/coverage',
  collectCoverageFrom: [
    'packages/*/src/**/*.ts',
    'server/src/**/*.ts',
    '!**/*.d.ts',
    '!**/index.ts',
    '!**/node_modules/**',
  ],
};

export default config;
