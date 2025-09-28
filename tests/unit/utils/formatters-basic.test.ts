/**
 * 기본 포매터 테스트
 */

import { formatPrice, htmlToText, truncateText } from '../../../src/utils/formatters.js';

describe('Basic Formatters', () => {

  describe('formatPrice', () => {
    test('가격을 올바르게 포맷팅해야 함', () => {
      expect(formatPrice(15000)).toBe('₩15,000');
      expect(formatPrice(1000000)).toBe('₩1,000,000');
      expect(formatPrice(0)).toBe('₩0');
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
});