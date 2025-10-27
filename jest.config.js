module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/server/__tests__/**/*.test.js'],
  collectCoverageFrom: [
    'server/middleware/**/*.js',
    'server/routes/**/*.js',
    'server/services/**/*.js',
    'server/utils/**/*.js',
    '!node_modules/**',
  ],
  coveragePathIgnorePatterns: ['/node_modules/', '/__tests__/'],
  coverageThreshold: {
    global: {
      branches: 5,
      functions: 10,
      lines: 5,
      statements: 5,
    },
  },
  testTimeout: 10000,
  verbose: true,
};
