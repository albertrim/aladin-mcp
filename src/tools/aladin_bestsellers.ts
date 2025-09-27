/**
 * aladin_bestsellers MCP 도구
 *
 * 분야별 베스트셀러 목록을 조회합니다.
 */

import type {
  AladinBestsellersInput,
  McpToolResponse,
  ListResponse,
  CompleteBookItem,
  ValidationResult
} from '../types.js';
import { AladinApiClient } from '../client.js';
import { validateAladinBestsellersInput } from '../utils/validators.js';
import { formatMcpSuccessResponse, formatMcpErrorResponse, formatBookItem } from '../utils/formatters.js';
import { getLogger } from '../utils/logger.js';

const logger = getLogger();

/**
 * aladin_bestsellers 도구 핸들러
 */
export async function handleAladinBestsellers(input: AladinBestsellersInput): Promise<McpToolResponse<{
  books: CompleteBookItem[];
  categoryId: number;
  categoryName?: string;
  period?: string;
  itemsPerPage: number;
}>> {
  const startTime = Date.now();
  const categoryId = input.categoryId || 0;

  try {
    // 입력값 검증
    logger.info('aladin_bestsellers 입력값 검증', { categoryId });

    const validation: ValidationResult = await validateAladinBestsellersInput(input);
    if (!validation.isValid) {
      logger.warn('aladin_bestsellers 입력값 검증 실패', {
        errors: validation.errors,
        input
      });

      return formatMcpErrorResponse({
        code: 300,
        message: `입력값 검증 실패: ${validation.errors.join(', ')}`,
        timestamp: new Date().toISOString()
      });
    }

    // API 클라이언트 초기화
    const client = new AladinApiClient();

    // 베스트셀러 조회 파라미터 준비
    const listParams = {
      QueryType: 'Bestseller' as const,
      CategoryId: categoryId,
      SearchTarget: input.searchTarget || 'Book',
      Year: input.year,
      Month: input.month,
      Week: input.week,
      Start: input.start || 1,
      MaxResults: input.maxResults || 10,
      Cover: input.cover || 'Small'
    };

    logger.info('aladin_bestsellers API 요청', { listParams });

    // 알라딘 API 호출
    const response: ListResponse = await client.getBestsellerList(listParams);

    // 응답 데이터 처리
    const formattedBooks = response.item.map(book => formatBookItem(book));

    // 기간 정보 생성
    let period: string | undefined;
    if (input.year || input.month || input.week) {
      const parts: string[] = [];
      if (input.year) parts.push(`${input.year}년`);
      if (input.month) parts.push(`${input.month}월`);
      if (input.week) parts.push(`${input.week}주`);
      period = parts.join(' ');
    }

    // 카테고리명 추출 (첫 번째 도서에서)
    let categoryName: string | undefined;
    if (formattedBooks.length > 0 && formattedBooks[0].categoryName) {
      categoryName = formattedBooks[0].categoryName;
    }

    const result = {
      books: formattedBooks,
      categoryId,
      categoryName,
      period,
      itemsPerPage: formattedBooks.length
    };

    const endTime = Date.now();
    logger.info('aladin_bestsellers 성공', {
      resultCount: formattedBooks.length,
      categoryName,
      period,
      responseTime: endTime - startTime
    });

    return formatMcpSuccessResponse(result, {
      query: `베스트셀러 카테고리 ${categoryId}`
    });

  } catch (error: any) {
    const endTime = Date.now();

    logger.error('aladin_bestsellers 실행 중 오류 발생', error, {
      input,
      categoryId,
      responseTime: endTime - startTime
    });

    return formatMcpErrorResponse({
      code: error.code || 900,
      message: `베스트셀러 조회 중 오류가 발생했습니다: ${error.message}`,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * aladin_bestsellers 도구 메타데이터
 */
export const ALADIN_BESTSELLERS_TOOL = {
  name: 'aladin_bestsellers',
  description: '분야별 베스트셀러 목록을 조회합니다.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      categoryId: {
        type: 'number' as const,
        description: '카테고리 ID (0: 전체)',
        minimum: 0,
        maximum: 99999,
        default: 0
      },
      searchTarget: {
        type: 'string' as const,
        enum: ['Book', 'Foreign', 'eBook', 'Music', 'DVD'],
        description: '검색 대상',
        default: 'Book'
      },
      year: {
        type: 'number' as const,
        description: '년도',
        minimum: 1900,
        maximum: 2030
      },
      month: {
        type: 'number' as const,
        description: '월',
        minimum: 1,
        maximum: 12
      },
      week: {
        type: 'number' as const,
        description: '주',
        minimum: 1,
        maximum: 5
      },
      start: {
        type: 'number' as const,
        description: '시작 위치',
        minimum: 1,
        maximum: 1000,
        default: 1
      },
      maxResults: {
        type: 'number' as const,
        description: '결과 개수',
        minimum: 1,
        maximum: 50,
        default: 10
      },
      cover: {
        type: 'string' as const,
        enum: ['None', 'Small', 'MidBig', 'Big'],
        description: '표지 이미지 크기',
        default: 'Small'
      }
    }
  }
};