/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/specs/**/*.e2e-spec.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: './tsconfig.json' }],
  },
  globalSetup: './setup/global-setup.ts',
  globalTeardown: './setup/global-teardown.ts',
  maxWorkers: 1,
  testTimeout: 60000,
  verbose: true,
  bail: false,
};
