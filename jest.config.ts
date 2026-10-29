import type { Config } from 'jest';

const config: Config = {
  rootDir: 'src',
  moduleFileExtensions: ['js', 'json', 'ts'],
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  testEnvironment: 'node',
  coverageDirectory: '../coverage',
  coverageReporters: ['text', 'lcov'],
  // Mismo criterio que sonar.coverage.exclusions en sonar-project.properties
  collectCoverageFrom: [
    '**/*.ts',
    '!main.ts',
    '!**/*.module.ts',
    '!**/*.dto.ts',
    '!**/*.port.ts',
    '!**/index.ts',
    '!**/*.spec.ts',
    '!generated/**',
  ],
  coverageThreshold: {
    global: { lines: 80, branches: 80, functions: 80, statements: 80 },
    './**/domain/**/*.ts': { lines: 100 },
    './**/application/**/*.ts': { lines: 100 },
  },
};

export default config;
