/**
 * API 상수 기본 테스트
 */

import {
  ALADIN_API_BASE_URL,
  API_ENDPOINTS,
  API_VERSION,
  DEFAULT_OUTPUT_FORMAT,
  SEARCH_TARGETS,
  QUERY_TYPES,
  SORT_OPTIONS,
  COVER_SIZES,
  OPT_RESULTS,
  ERROR_MESSAGES
} from '../../../src/constants/api.js';

describe('API Constants', () => {

  describe('ALADIN_API_BASE_URL', () => {
    test('알라딘 API 기본 URL이 정의되어야 함', () => {
      expect(ALADIN_API_BASE_URL).toBeDefined();
      expect(typeof ALADIN_API_BASE_URL).toBe('string');
      expect(ALADIN_API_BASE_URL).toContain('aladin.co.kr');
    });
  });

  describe('API_ENDPOINTS', () => {
    test('모든 엔드포인트가 정의되어야 함', () => {
      expect(API_ENDPOINTS.ITEM_SEARCH).toBeDefined();
      expect(API_ENDPOINTS.ITEM_LOOKUP).toBeDefined();
      expect(API_ENDPOINTS.ITEM_LIST).toBeDefined();

      expect(API_ENDPOINTS.ITEM_SEARCH).toBe('ItemSearch.aspx');
      expect(API_ENDPOINTS.ITEM_LOOKUP).toBe('ItemLookUp.aspx');
      expect(API_ENDPOINTS.ITEM_LIST).toBe('ItemList.aspx');
    });
  });

  describe('API_VERSION', () => {
    test('API 버전이 정의되어야 함', () => {
      expect(API_VERSION).toBe('20070901');
    });
  });

  describe('DEFAULT_OUTPUT_FORMAT', () => {
    test('기본 출력 형식이 정의되어야 함', () => {
      expect(DEFAULT_OUTPUT_FORMAT).toBe('JS');
    });
  });

  describe('SEARCH_TARGETS', () => {
    test('검색 대상 맵이 정의되어야 함', () => {
      expect(SEARCH_TARGETS.Book).toBe('국내도서');
      expect(SEARCH_TARGETS.Foreign).toBe('외국도서');
      expect(SEARCH_TARGETS.eBook).toBe('전자책');
      expect(SEARCH_TARGETS.Music).toBe('음반');
      expect(SEARCH_TARGETS.DVD).toBe('DVD');
    });
  });

  describe('QUERY_TYPES', () => {
    test('쿼리 타입 맵이 정의되어야 함', () => {
      expect(QUERY_TYPES.Title).toBe('제목');
      expect(QUERY_TYPES.Author).toBe('저자');
      expect(QUERY_TYPES.Publisher).toBe('출판사');
      expect(QUERY_TYPES.Keyword).toBe('키워드');
    });
  });

  describe('SORT_OPTIONS', () => {
    test('정렬 옵션 맵이 정의되어야 함', () => {
      expect(SORT_OPTIONS.Accuracy).toBe('정확도순');
      expect(SORT_OPTIONS.PublishTime).toBe('출간일순');
      expect(SORT_OPTIONS.Title).toBe('제목순');
      expect(SORT_OPTIONS.SalesPoint).toBe('판매량순');
      expect(SORT_OPTIONS.CustomerRating).toBe('고객평점순');
    });
  });

  describe('COVER_SIZES', () => {
    test('커버 크기 맵이 정의되어야 함', () => {
      expect(COVER_SIZES.None).toBe('표지없음');
      expect(COVER_SIZES.Small).toBe('소형');
      expect(COVER_SIZES.MidBig).toBe('중형');
      expect(COVER_SIZES.Big).toBe('대형');
    });
  });

  describe('OPT_RESULTS', () => {
    test('옵션 결과 맵이 정의되어야 함', () => {
      expect(OPT_RESULTS.authors).toBe('저자정보');
      expect(OPT_RESULTS.fulldescription).toBe('상세설명');
      expect(OPT_RESULTS.Toc).toBe('목차');
      expect(OPT_RESULTS.Story).toBe('책소개');
      expect(OPT_RESULTS.categoryIdList).toBe('카테고리정보');
    });
  });

  describe('ERROR_MESSAGES', () => {
    test('에러 메시지 맵이 정의되어야 함', () => {
      expect(ERROR_MESSAGES).toBeDefined();
      expect(typeof ERROR_MESSAGES).toBe('object');
    });
  });
});