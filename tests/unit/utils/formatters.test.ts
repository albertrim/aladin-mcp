/**
 * 포매터 유틸리티 단위 테스트
 * 데이터 포매팅, 변환, 정규화 함수들의 테스트
 */

import {
  formatBookItem,
  formatSearchResponseToMcp,
  formatLookupResponseToMcp,
  formatPrice,
  formatDateToKorean,
  formatAuthorInfo,
  cleanDescription,
  truncateText,
  htmlToText,
  formatDiscountRate,
  formatPublishDate,
  formatAuthorNames,
  cleanTitle,
  formatMcpSuccessResponse,
  formatMcpErrorResponse
} from '../../../src/utils/formatters.js';

import type {
  CompleteBookItem,
  SearchResponse,
  LookupResponse,
  Author,
  StandardError
} from '../../../src/types.js';

import { ErrorCode } from '../../../src/types.js';

describe('포매터 유틸리티 테스트', () => {

  describe('formatBookItem', () => {
    test('도서 정보를 올바르게 포맷팅해야 함', () => {
      const book: CompleteBookItem = {
        title: '테스트 도서',
        author: '테스트 저자',
        publisher: '테스트 출판사',
        pubDate: '2024-01-01',
        isbn: '9788901234567',
        isbn13: '9788901234567',
        itemId: 12345,
        cover: 'https://image.aladin.co.kr/product/12345/cover.jpg',
        categoryId: 1,
        categoryName: '컴퓨터',
        priceSales: 15000,
        priceStandard: 20000,
        description: '<p>테스트 설명</p>',
        link: 'https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=12345',
        mallType: 'BOOK',
        stockStatus: '판매중',
        mileage: 150,
        salesPoint: 1000,
        adult: false,
        fixedPrice: true,
        customerReviewRank: 9
      };

      const result = formatBookItem(book);

      expect(result.title).toBe('테스트 도서');
      expect(result.author).toBe('테스트 저자');
      expect(result.publisher).toBe('테스트 출판사');
    });
  });

  describe('formatSearchResponseToMcp', () => {
    test('검색 응답을 MCP 형식으로 포맷팅해야 함', () => {
      const response: SearchResponse = {
        version: '20070901',
        title: 'Aladin 도서 검색 결과',
        link: 'https://www.aladin.co.kr',
        pubDate: '2024-01-01',
        totalResults: 1,
        startIndex: 1,
        itemsPerPage: 10,
        query: '테스트',
        item: [{
          title: '테스트 도서',
          author: '테스트 저자',
          publisher: '테스트 출판사',
          pubDate: '2024-01-01',
          isbn: '9788901234567',
          isbn13: '9788901234567',
          itemId: 12345,
          cover: 'https://image.aladin.co.kr/product/12345/cover.jpg',
          categoryId: 1,
          categoryName: '컴퓨터',
          priceSales: 15000,
          priceStandard: 20000,
          description: '테스트 설명',
          link: 'https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=12345',
          mallType: 'BOOK',
          stockStatus: '판매중',
          mileage: 150,
          salesPoint: 1000,
          adult: false,
          fixedPrice: true,
          customerReviewRank: 9
        }]
      };

      const result = formatSearchResponseToMcp(response);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.metadata?.totalResults).toBe(1);
    });
  });

  describe('formatPrice', () => {
    test('가격을 올바르게 포맷팅해야 함', () => {
      expect(formatPrice(15000)).toBe('₩15,000');
      expect(formatPrice(1000000)).toBe('₩1,000,000');
      expect(formatPrice(0)).toBe('₩0');
    });
  });

  describe('formatDateToKorean', () => {
    test('날짜를 한국어 형식으로 포맷팅해야 함', () => {
      expect(formatDateToKorean('2024-01-01')).toContain('2024년');
      expect(formatDateToKorean('2024-12-25')).toContain('12월');
    });
  });

  describe('formatAuthorInfo', () => {
    test('저자 정보를 올바르게 포맷팅해야 함', () => {
      const author: Author = {
        authorId: 12345,
        authorName: '홍길동',
        authorType: 'author',
        authorInfo: '소설가'
      };

      const result = formatAuthorInfo(author);

      expect(result.authorName).toBe('홍길동');
      expect(result.authorType).toBe('저자');
    });
  });

  describe('cleanDescription', () => {
    test('설명에서 HTML 태그를 제거해야 함', () => {
      const htmlDescription = '<p>테스트 <strong>설명</strong></p><br>';
      const result = cleanDescription(htmlDescription);

      expect(result).not.toContain('<p>');
      expect(result).not.toContain('<strong>');
      expect(result).toContain('테스트');
      expect(result).toContain('설명');
    });
  });

  describe('truncateText', () => {
    test('텍스트를 지정된 길이로 자르고 말줄임표를 추가해야 함', () => {
      const longText = '매우 긴 텍스트입니다. 이 텍스트는 지정된 길이보다 훨씬 깁니다.';
      const result = truncateText(longText, 10);

      expect(result.length).toBeLessThanOrEqual(13); // 10 + '...'
      expect(result).toContain('...');
    });

    test('짧은 텍스트는 그대로 반환해야 함', () => {
      const shortText = '짧은 텍스트';
      const result = truncateText(shortText, 20);

      expect(result).toBe(shortText);
      expect(result).not.toContain('...');
    });
  });

  describe('htmlToText', () => {
    test('HTML을 일반 텍스트로 변환해야 함', () => {
      const html = '<div><p>안녕하세요</p><br><strong>테스트</strong></div>';
      const result = htmlToText(html);

      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
      expect(result).toContain('안녕하세요');
      expect(result).toContain('테스트');
    });
  });

  describe('formatDiscountRate', () => {
    test('할인율을 올바르게 계산하고 포맷팅해야 함', () => {
      const standardPrice = 20000;
      const salesPrice = 15000;
      const result = formatDiscountRate(standardPrice, salesPrice);

      expect(result).toBe('25% 할인');
    });

    test('할인이 없는 경우 0%를 반환해야 함', () => {
      const standardPrice = 20000;
      const salesPrice = 20000;
      const result = formatDiscountRate(standardPrice, salesPrice);

      expect(result).toBe('할인 없음');
    });
  });

  describe('formatPublishDate', () => {
    test('출간일을 올바르게 포맷팅해야 함', () => {
      const result = formatPublishDate('2024-01-01');
      expect(result).toContain('2024');
    });
  });

  describe('formatAuthorNames', () => {
    test('저자명을 올바르게 포맷팅해야 함', () => {
      const authors = '홍길동, 김철수 (지은이)';
      const result = formatAuthorNames(authors);

      expect(result).toContain('홍길동');
      expect(result).toContain('김철수');
    });
  });

  describe('cleanTitle', () => {
    test('제목에서 불필요한 문자를 제거해야 함', () => {
      const title = '  테스트 도서 제목  ';
      const result = cleanTitle(title);

      expect(result).toBe('테스트 도서 제목');
      expect(result).not.toMatch(/^\s/);
      expect(result).not.toMatch(/\s$/);
    });
  });

  describe('formatMcpSuccessResponse', () => {
    test('성공 응답을 MCP 형식으로 포맷팅해야 함', () => {
      const data = ['test1', 'test2'];
      const metadata = { totalResults: 2, startIndex: 1, itemsPerPage: 10, query: 'test' };
      const result = formatMcpSuccessResponse(data, metadata);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(data);
      expect(result.metadata).toMatchObject(metadata);
      expect(result.metadata?.timestamp).toBeDefined();
      expect(result.error).toBeUndefined();
    });
  });

  describe('formatMcpErrorResponse', () => {
    test('에러 응답을 MCP 형식으로 포맷팅해야 함', () => {
      const error: StandardError = {
        code: ErrorCode.INVALID_PARAM_VALUE,
        message: '입력값이 잘못되었습니다',
        timestamp: new Date().toISOString()
      };

      const result = formatMcpErrorResponse(error);

      expect(result.success).toBe(false);
      expect(result.error).toEqual(error);
      expect(result.data).toBeUndefined();
    });
  });
});