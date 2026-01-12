/**
 * Jest Configuration
 */
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/server/__tests__/**/*.test.js'],
  collectCoverageFrom: [
    'server/**/*.js',
    '!server/node_modules/**',
    '!server/__tests__/**',
  ],
  coverageDirectory: 'coverage',
  verbose: true,
  // Force Jest to resolve modules from root node_modules, not server/node_modules
  moduleDirectories: ['node_modules'],
  // Ignore server's local node_modules to prevent module resolution conflicts
  modulePathIgnorePatterns: ['<rootDir>/server/node_modules'],
  // Transform settings
  transformIgnorePatterns: ['/node_modules/'],
};
