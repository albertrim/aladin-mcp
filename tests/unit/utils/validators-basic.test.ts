/**
 * 기본 Validators 테스트
 */

import {
  validateIsbn10,
  validateIsbn13,
  validateIsbn,
  validateTtbKey,
  validateQuery
} from '../../../src/utils/validators.js';

describe('Basic Validators', () => {

  describe('validateIsbn10', () => {
    test('유효한 ISBN-10을 검증해야 함', () => {
      // 실제 유효한 ISBN-10: Harry Potter and the Philosopher's Stone
      const result = validateIsbn10('0747532699');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('무효한 ISBN-10을 거부해야 함', () => {
      const result = validateIsbn10('123456789');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('빈 문자열을 거부해야 함', () => {
      const result = validateIsbn10('');
      expect(result.isValid).toBe(false);
    });
  });

  describe('validateIsbn13', () => {
    test('유효한 ISBN-13을 검증해야 함', () => {
      // 실제 유효한 ISBN-13: Harry Potter and the Philosopher's Stone
      const result = validateIsbn13('9780747532699');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('무효한 ISBN-13을 거부해야 함', () => {
      const result = validateIsbn13('123456789012');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('validateIsbn', () => {
    test('ISBN-10과 ISBN-13 모두 검증해야 함', () => {
      const isbn10Result = validateIsbn('0747532699');
      expect(isbn10Result.isValid).toBe(true);

      const isbn13Result = validateIsbn('9780747532699');
      expect(isbn13Result.isValid).toBe(true);
    });
  });

  describe('validateTtbKey', () => {
    test('유효한 TTB 키를 검증해야 함', () => {
      const result = validateTtbKey('valid_api_key_example');
      expect(result.isValid).toBe(true);
    });

    test('빈 TTB 키를 거부해야 함', () => {
      const result = validateTtbKey('');
      expect(result.isValid).toBe(false);
    });
  });

  describe('validateQuery', () => {
    test('유효한 검색어를 검증해야 함', () => {
      const result = validateQuery('프로그래밍');
      expect(result.isValid).toBe(true);
    });

    test('빈 검색어를 거부해야 함', () => {
      const result = validateQuery('');
      expect(result.isValid).toBe(false);
    });

    test('너무 긴 검색어를 거부해야 함', () => {
      const longQuery = 'a'.repeat(1000);
      const result = validateQuery(longQuery);
      expect(result.isValid).toBe(false);
    });
  });
});