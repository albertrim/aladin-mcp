/**
 * Jest 테스트 설정 파일
 * 모든 테스트 실행 전에 로드되는 설정
 */

// 환경변수 설정
process.env.NODE_ENV = 'test';
process.env.TTB_KEY = 'test-ttb-key';
process.env.LOG_LEVEL = 'error';

// 타임아웃 설정
jest.setTimeout(30000);

// 전역 모킹 설정
beforeAll(() => {
  // 콘솔 로그 억제 (필요시)
  if (process.env.SUPPRESS_LOGS) {
    console.log = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();
  }
});

afterAll(() => {
  // 테스트 후 정리 작업
});

// 각 테스트 전후 공통 설정
beforeEach(() => {
  // 각 테스트 전 초기화
});

afterEach(() => {
  // 각 테스트 후 정리
  jest.clearAllMocks();
});