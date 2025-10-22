const nextJest = require("next/jest")

const createJestConfig = nextJest({
  dir: "./",
})

const customJestConfig = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testEnvironment: "jest-environment-node",
  preset: "ts-jest",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  testMatch: [
    "**/__tests__/**/*.test.ts", 
    "**/__tests__/**/*.test.tsx",
    "**/lib/**/__tests__/**/*.test.ts",
    "**/app/**/__tests__/**/*.test.ts"
  ],
  testTimeout: 15000,
  collectCoverageFrom: [
    "lib/**/*.{ts,tsx}",
    "app/api/**/*.{ts,tsx}",
    "components/**/*.{ts,tsx}",
    "!**/*.d.ts",
    "!**/node_modules/**",
    "!**/__tests__/**"
  ],
  coverageReporters: ["text", "lcov", "html"],
  coverageDirectory: "coverage",
  verbose: true,
  transformIgnorePatterns: [
    "node_modules/(?!(uuid)/)"
  ],
  extensionsToTreatAsEsm: ['.ts'],
  globals: {
    'ts-jest': {
      useESM: true
    }
  }
}

module.exports = createJestConfig(customJestConfig)
