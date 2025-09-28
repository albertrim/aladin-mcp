/**
 * aladin_new_books MCP 도구
 *
 * 신간 도서 목록을 조회합니다.
 */

import type {
  AladinNewBooksInput,
  McpToolResponse,
  ListResponse,
  CompleteBookItem,
  ValidationResult
} from '../types.js';
import { AladinApiClient } from '../client.js';
import { validateAladinNewBooksInput } from '../utils/validators.js';
import { formatMcpSuccessResponse, formatMcpErrorResponse, formatBookItem } from '../utils/formatters.js';
import { getLogger } from '../utils/logger.js';

const logger = getLogger();

/**
 * aladin_new_books 도구 핸들러
 */
export async function handleAladinNewBooks(input: AladinNewBooksInput): Promise<McpToolResponse<{
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
    logger.info('aladin_new_books 입력값 검증', { categoryId });

    const validation: ValidationResult = await validateAladinNewBooksInput(input);
    if (!validation.isValid) {
      logger.warn('aladin_new_books 입력값 검증 실패', { errors: validation.errors, input });
      return formatMcpErrorResponse({
        code: 300,
        message: `입력값 검증 실패: ${validation.errors.join(', ')}`,
        timestamp: new Date().toISOString()
      });
    }

    // API 클라이언트 초기화
    const client = new AladinApiClient();

    // 신간 조회 파라미터 준비
    const listParams = {
      QueryType: input.queryType || 'NewBook',
      CategoryId: categoryId,
      SearchTarget: input.searchTarget || 'Book',
      Start: input.start || 1,
      MaxResults: input.maxResults || 10,
      Cover: input.cover || 'Small'
    };

    logger.info('aladin_new_books API 요청', { listParams });

    // 알라딘 API 호출
    const response: ListResponse = await client.getNewReleasesList(listParams);

    // 응답 데이터 처리
    const formattedBooks = response.item.map(book => formatBookItem(book));

    // 기간 정보 생성
    // 기간 정보는 신간 도구에서는 별도 제공하지 않음
    const period: string | undefined = undefined;

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
    logger.info('aladin_new_books 성공', {
      resultCount: formattedBooks.length,
      categoryName,
      responseTime: endTime - startTime
    });

    return formatMcpSuccessResponse(result, {
      totalResults: formattedBooks.length,
      query: `신간 카테고리 ${categoryId}`
    });

  } catch (error: any) {
    const endTime = Date.now();

    logger.error('aladin_new_books 실행 중 오류 발생', error, { input, categoryId, responseTime: endTime - startTime });
    return formatMcpErrorResponse({
      code: error.code || 900,
      message: `신간 조회 중 오류가 발생했습니다: ${error.message}`,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * aladin_new_books 도구 메타데이터
 */
export const ALADIN_NEW_BOOKS_TOOL = {
  name: 'aladin_new_books',
  description: '신간 도서 목록을 조회합니다.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      queryType: {
        type: 'string' as const,
        enum: ['NewBook', 'NewSpecial'],
        description: '신간 타입',
        default: 'NewBook'
      },
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