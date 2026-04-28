module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  testMatch: ['**/__tests__/**/*.test.(ts|tsx)'],
  testPathIgnorePatterns: ['/node_modules/', '/tests/e2e/'],
  collectCoverageFrom: [
    'app/**/*.ts',
    '!app/**/*.d.ts',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
};