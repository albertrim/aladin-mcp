/**
 * aladin_search MCP 도구
 *
 * 알라딘에서 도서를 검색합니다. 키워드, 제목, 저자, 출판사로 검색할 수 있습니다.
 */

import type {
  AladinSearchInput,
  McpToolResponse,
  SearchResponse,
  CompleteBookItem,
  ValidationResult
} from '../types.js';
import { AladinApiClient } from '../client.js';
import { validateAladinSearchInput } from '../utils/validators.js';
import { formatMcpSuccessResponse, formatMcpErrorResponse, formatBookItem } from '../utils/formatters.js';
import { getLogger } from '../utils/logger.js';

const logger = getLogger();

/**
 * aladin_search 도구 핸들러
 */
export async function handleAladinSearch(input: AladinSearchInput): Promise<McpToolResponse<{
  books: CompleteBookItem[];
  totalResults: number;
  startIndex: number;
  itemsPerPage: number;
  query: string;
}>> {
  const startTime = Date.now();

  try {
    // 입력값 검증
    logger.info('aladin_search 입력값 검증', { query: input.query });

    const validation: ValidationResult = await validateAladinSearchInput(input);
    if (!validation.isValid) {
      logger.warn('aladin_search 입력값 검증 실패', {
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

    // 검색 파라미터 준비
    const searchParams = {
      Query: input.query.trim(),
      QueryType: input.queryType || 'Title',
      SearchTarget: input.searchTarget || 'Book',
      Sort: input.sort || 'Accuracy',
      Cover: input.cover || 'Small',
      CategoryId: input.categoryId,
      Start: input.start || 1,
      MaxResults: input.maxResults || 10,
      OptResult: input.optResult || []
    };

    logger.info('aladin_search API 요청', { searchParams });

    // 알라딘 API 호출
    const response: SearchResponse = await client.searchBooks(searchParams);

    // 응답 데이터 처리
    const formattedBooks = response.item.map(book => formatBookItem(book));

    const result = {
      books: formattedBooks,
      totalResults: response.totalResults,
      startIndex: response.startIndex,
      itemsPerPage: response.itemsPerPage,
      query: response.query
    };

    const endTime = Date.now();
    logger.info('aladin_search 성공', {
      resultCount: formattedBooks.length,
      totalResults: response.totalResults,
      responseTime: endTime - startTime
    });

    return formatMcpSuccessResponse(result, {
      totalResults: response.totalResults,
      startIndex: response.startIndex,
      itemsPerPage: response.itemsPerPage,
      query: response.query
    });

  } catch (error: any) {
    const endTime = Date.now();

    logger.error('aladin_search 실행 중 오류 발생', error, {
      input,
      responseTime: endTime - startTime
    });

    return formatMcpErrorResponse({
      code: error.code || 900,
      message: `도서 검색 중 오류가 발생했습니다: ${error.message}`,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * aladin_search 도구 메타데이터
 */
export const ALADIN_SEARCH_TOOL = {
  name: 'aladin_search',
  description: '알라딘에서 도서를 검색합니다. 키워드, 제목, 저자, 출판사로 검색할 수 있습니다.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      query: {
        type: 'string' as const,
        description: '검색할 키워드 (필수)',
        minLength: 1,
        maxLength: 200
      },
      queryType: {
        type: 'string' as const,
        enum: ['Title', 'Author', 'Publisher', 'Keyword'],
        description: '검색 타입 (Title: 제목, Author: 저자, Publisher: 출판사, Keyword: 키워드)',
        default: 'Title'
      },
      searchTarget: {
        type: 'string' as const,
        enum: ['Book', 'Foreign', 'eBook', 'Music', 'DVD'],
        description: '검색 대상 (Book: 국내도서, Foreign: 외국도서, eBook: 전자책)',
        default: 'Book'
      },
      sort: {
        type: 'string' as const,
        enum: ['Accuracy', 'PublishTime', 'Title', 'SalesPoint', 'CustomerRating'],
        description: '정렬 순서',
        default: 'Accuracy'
      },
      categoryId: {
        type: 'number' as const,
        description: '카테고리 ID (선택사항)',
        minimum: 0,
        maximum: 99999
      },
      start: {
        type: 'number' as const,
        description: '검색 시작 위치',
        minimum: 1,
        maximum: 1000,
        default: 1
      },
      maxResults: {
        type: 'number' as const,
        description: '검색 결과 개수',
        minimum: 1,
        maximum: 50,
        default: 10
      },
      cover: {
        type: 'string' as const,
        enum: ['None', 'Small', 'MidBig', 'Big'],
        description: '표지 이미지 크기',
        default: 'Small'
      },
      optResult: {
        type: 'array' as const,
        items: {
          type: 'string' as const,
          enum: ['authors', 'fulldescription', 'Toc', 'Story', 'categoryIdList']
        },
        description: '부가 정보 옵션'
      }
    },
    required: ['query']
  }
};