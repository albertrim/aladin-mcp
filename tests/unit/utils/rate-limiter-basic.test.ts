/**
 * 기본 Rate Limiter 테스트
 */

import { AladinRateLimiter, getRateLimiter } from '../../../src/utils/rate-limiter.js';

describe('Basic Rate Limiter', () => {

  describe('getRateLimiter', () => {
    test('Rate Limiter를 가져올 수 있어야 함', () => {
      const limiter = getRateLimiter();

      expect(limiter).toBeDefined();
      expect(typeof limiter.checkRateLimit).toBe('function');
      expect(typeof limiter.recordApiCall).toBe('function');
      expect(typeof limiter.getMetrics).toBe('function');
    });
  });

  describe('checkRateLimit', () => {
    test('요청 제한을 확인할 수 있어야 함', async () => {
      const limiter = getRateLimiter();

      // 기본 메서드 호출이 정상 작동하는지 확인
      await expect(limiter.checkRateLimit()).resolves.not.toThrow();
    });
  });

  describe('recordApiCall', () => {
    test('API 호출을 기록할 수 있어야 함', () => {
      const limiter = getRateLimiter();

      // 기본 메서드 호출이 정상 작동하는지 확인
      expect(() => {
        limiter.recordApiCall();
      }).not.toThrow();
    });
  });

  describe('getMetrics', () => {
    test('메트릭 정보를 가져올 수 있어야 함', () => {
      const limiter = getRateLimiter();

      const metrics = limiter.getMetrics();

      expect(metrics).toBeDefined();
      expect(typeof metrics.averageResponseTime).toBe('number');
      expect(typeof metrics.requestsPerMinute).toBe('number');
      expect(typeof metrics.successRate).toBe('number');
    });
  });
});