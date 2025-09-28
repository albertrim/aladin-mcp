/**
 * 기본 에러 핸들러 테스트
 */

import {
  getErrorHandler,
  handleAladinApiError,
  handleNetworkError,
  handleValidationError
} from '../../../src/utils/error-handler.js';
import { ErrorCode } from '../../../src/types.js';

describe('Basic Error Handler', () => {

  describe('getErrorHandler', () => {
    test('에러 핸들러를 가져올 수 있어야 함', () => {
      const handler = getErrorHandler();

      expect(handler).toBeDefined();
      expect(typeof handler.handleAladinApiError).toBe('function');
    });
  });

  describe('handleValidationError', () => {
    test('검증 에러를 처리할 수 있어야 함', () => {
      const validationResult = {
        isValid: false,
        errors: ['필수 파라미터 누락']
      };

      const error = handleValidationError(validationResult);

      expect(error.code).toBe(ErrorCode.INVALID_PARAM_VALUE);
      expect(error.message).toContain('필수 파라미터 누락');
      expect(error.timestamp).toBeDefined();
    });
  });

  describe('handleNetworkError', () => {
    test('네트워크 에러를 처리할 수 있어야 함', () => {
      const networkError = new Error('Network timeout');

      const error = handleNetworkError(networkError);

      expect(error.code).toBe(ErrorCode.SYSTEM_ERROR);
      expect(error.message).toContain('네트워크 연결에 실패했습니다');
      expect(error.timestamp).toBeDefined();
    });
  });

  describe('handleAladinApiError', () => {
    test('알라딘 API 에러를 처리할 수 있어야 함', () => {
      const apiError = {
        errorCode: 100,
        errorMessage: 'TTB 키가 유효하지 않습니다'
      };

      const error = handleAladinApiError(apiError);

      expect(error.code).toBeDefined();
      expect(error.message).toContain('잘못된 TTB 키입니다');
      expect(error.timestamp).toBeDefined();
    });
  });
});