/** @type {import('jest').Config} */
module.exports = {
  // TypeScript 지원
  preset: 'ts-jest',
  testEnvironment: 'node',

  // 테스트 파일 패턴
  testMatch: [
    '**/tests/**/*.test.ts',
    '**/tests/**/*.spec.ts',
    '**/__tests__/**/*.ts'
  ],

  // 소스 파일 위치
  roots: ['<rootDir>/src', '<rootDir>/tests'],

  // 모듈 경로 매핑
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1'
  },

  // 커버리지 설정
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },

  // 설정 파일들
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],

  // TypeScript 변환 설정
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },

  // 모듈 파일 확장자
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],

  // 테스트 타임아웃 (30초)
  testTimeout: 30000,

  // 자세한 출력
  verbose: true,

  // 캐시 디렉토리
  cacheDirectory: '<rootDir>/.jest-cache'
};