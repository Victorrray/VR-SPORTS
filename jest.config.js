module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/server/__tests__/**/*.test.js'],
  collectCoverageFrom: [
    'server/**/*.js',
    '!server/index.js',
    '!server/config/**',
    '!server/migrations/**',
    '!node_modules/**',
  ],
  coveragePathIgnorePatterns: ['/node_modules/', '/__tests__/'],
  coverageThreshold: {
    global: {
      branches: 30,
      functions: 30,
      lines: 30,
      statements: 30,
    },
  },
  testTimeout: 10000,
  verbose: true,
};
