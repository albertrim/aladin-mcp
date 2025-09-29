/**
 * 검증 로직 단위 테스트
 * 입력값 검증, 데이터 형식 검증 등의 유틸리티 함수 테스트
 */

import {
  validateIsbn10,
  validateIsbn13,
  validateIsbn,
  validateItemId,
  validateCategoryId,
  validateSearchTarget,
  validateQueryType,
  validateSortOption,
  validateCoverSize,
  validateOptResults,
  validateTtbKey,
  validateQuery,
  validateAladinSearchInput,
  validateAladinBookInfoInput,
  validateAladinBestsellersInput
} from '../../../src/utils/validators.js';

import type {
  ValidationResult,
  AladinSearchInput,
  AladinBookInfoInput,
  AladinBestsellersInput
} from '../../../src/types.js';

describe('Validators', () => {

  describe('validateIsbn10', () => {
    test('유효한 ISBN-10을 검증해야 함', () => {
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

  describe('validateItemId', () => {
    test('유효한 ItemId를 검증해야 함', () => {
      const result = validateItemId('12345');
      expect(result.isValid).toBe(true);
    });

    test('숫자가 아닌 ItemId를 거부해야 함', () => {
      const result = validateItemId('abc123');
      expect(result.isValid).toBe(false);
    });
  });

  describe('validateCategoryId', () => {
    test('유효한 카테고리 ID를 검증해야 함', () => {
      const result = validateCategoryId(1);
      expect(result.isValid).toBe(true);
    });

    test('음수 카테고리 ID를 거부해야 함', () => {
      const result = validateCategoryId(-1);
      expect(result.isValid).toBe(false);
    });

    test('범위를 초과하는 카테고리 ID를 거부해야 함', () => {
      const result = validateCategoryId(100000);
      expect(result.isValid).toBe(false);
    });
  });

  describe('validateSearchTarget', () => {
    test('유효한 검색 대상을 검증해야 함', () => {
      const validTargets = ['Book', 'Foreign', 'eBook', 'Music', 'DVD'];

      validTargets.forEach(target => {
        const result = validateSearchTarget(target);
        expect(result.isValid).toBe(true);
      });
    });

    test('무효한 검색 대상을 거부해야 함', () => {
      const result = validateSearchTarget('InvalidTarget');
      expect(result.isValid).toBe(false);
    });
  });

  describe('validateQueryType', () => {
    test('유효한 쿼리 타입을 검증해야 함', () => {
      const validTypes = ['Title', 'Author', 'Publisher', 'Keyword'];

      validTypes.forEach(type => {
        const result = validateQueryType(type);
        expect(result.isValid).toBe(true);
      });
    });

    test('무효한 쿼리 타입을 거부해야 함', () => {
      const result = validateQueryType('InvalidType');
      expect(result.isValid).toBe(false);
    });
  });

  describe('validateSortOption', () => {
    test('유효한 정렬 옵션을 검증해야 함', () => {
      const validOptions = ['Accuracy', 'PublishTime', 'Title', 'SalesPoint', 'CustomerRating'];

      validOptions.forEach(option => {
        const result = validateSortOption(option);
        expect(result.isValid).toBe(true);
      });
    });
  });

  describe('validateCoverSize', () => {
    test('유효한 커버 크기를 검증해야 함', () => {
      const validSizes = ['None', 'Small', 'MidBig', 'Big'];

      validSizes.forEach(size => {
        const result = validateCoverSize(size);
        expect(result.isValid).toBe(true);
      });
    });
  });

  describe('validateOptResults', () => {
    test('유효한 옵션 결과 배열을 검증해야 함', () => {
      const validOptions = ['authors', 'fulldescription', 'Toc'];
      const result = validateOptResults(validOptions);
      expect(result.isValid).toBe(true);
    });

    test('무효한 옵션을 포함한 배열을 거부해야 함', () => {
      const invalidOptions = ['invalid_option'];
      const result = validateOptResults(invalidOptions);
      expect(result.isValid).toBe(false);
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

    test('잘못된 형식의 TTB 키를 거부해야 함', () => {
      const result = validateTtbKey('invalid-key');
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

  describe('validateAladinSearchInput', () => {
    test('유효한 검색 입력을 검증해야 함', () => {
      const input: AladinSearchInput = {
        query: '프로그래밍',
        queryType: 'Title',
        searchTarget: 'Book',
        sort: 'Accuracy',
        cover: 'Small',
        start: 1,
        maxResults: 10
      };

      const result = validateAladinSearchInput(input);
      expect(result.isValid).toBe(true);
    });

    test('무효한 검색 입력을 거부해야 함', () => {
      const input: AladinSearchInput = {
        query: '', // 빈 검색어
        queryType: 'Title',
        searchTarget: 'Book'
      };

      const result = validateAladinSearchInput(input);
      expect(result.isValid).toBe(false);
    });
  });

  describe('validateAladinBookInfoInput', () => {
    test('유효한 도서 정보 입력을 검증해야 함', () => {
      const input: AladinBookInfoInput = {
        isbn13: '9780747532699',
        cover: 'Small'
      };

      const result = validateAladinBookInfoInput(input);
      expect(result.isValid).toBe(true);
    });

    test('무효한 ISBN을 가진 입력을 거부해야 함', () => {
      const input: AladinBookInfoInput = {
        isbn13: '123', // 잘못된 ISBN
        cover: 'Small'
      };

      const result = validateAladinBookInfoInput(input);
      expect(result.isValid).toBe(false);
    });
  });

  describe('validateAladinBestsellersInput', () => {
    test('유효한 베스트셀러 입력을 검증해야 함', () => {
      const input: AladinBestsellersInput = {
        categoryId: 1,
        searchTarget: 'Book',
        year: 2024,
        month: 1,
        week: 1
      };

      const result = validateAladinBestsellersInput(input);
      expect(result.isValid).toBe(true);
    });

    test('무효한 카테고리 ID를 가진 입력을 거부해야 함', () => {
      const input: AladinBestsellersInput = {
        categoryId: -1, // 무효한 카테고리 ID
        searchTarget: 'Book'
      };

      const result = validateAladinBestsellersInput(input);
      expect(result.isValid).toBe(false);
    });
  });
});