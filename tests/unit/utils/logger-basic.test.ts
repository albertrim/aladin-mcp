/**
 * 기본 로거 테스트
 */

import { getLogger, LogLevel } from '../../../src/utils/logger.js';

describe('Basic Logger', () => {

  describe('getLogger', () => {
    test('로거를 가져올 수 있어야 함', () => {
      const logger = getLogger({
        level: 'info',
        enableConsole: true
      });

      expect(logger).toBeDefined();
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.debug).toBe('function');
    });

    test('기본 설정으로 로거를 가져올 수 있어야 함', () => {
      const logger = getLogger();

      expect(logger).toBeDefined();
    });

    test('로그 메시지를 출력할 수 있어야 함', () => {
      const logger = getLogger({
        level: 'debug',
        enableConsole: true
      });

      // 실제 출력은 하지 않고 호출만 테스트
      expect(() => {
        logger.info('테스트 메시지');
        logger.error('에러 메시지');
        logger.warn('경고 메시지');
        logger.debug('디버그 메시지');
      }).not.toThrow();
    });
  });
});