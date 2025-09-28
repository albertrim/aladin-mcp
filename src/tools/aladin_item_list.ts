/**
 * aladin_item_list MCP 도구
 *
 * 추천/편집자 선택 등 다양한 도서 목록을 조회합니다.
 */

import type {
  AladinItemListInput,
  McpToolResponse,
  ListResponse,
  CompleteBookItem,
  ValidationResult
} from '../types.js';
import { AladinApiClient } from '../client.js';
import { validateAladinItemListInput } from '../utils/validators.js';
import { formatMcpSuccessResponse, formatMcpErrorResponse, formatBookItem } from '../utils/formatters.js';
import { getLogger } from '../utils/logger.js';

const logger = getLogger();

/**
 * aladin_item_list 도구 핸들러
 */
export async function handleAladinItemList(input: AladinItemListInput): Promise<McpToolResponse<{
  books: CompleteBookItem[];
  queryType: string;
  categoryId?: number;
  itemsPerPage: number;
}>> {
  const startTime = Date.now();

  try {
    // 입력값 검증
    logger.info('aladin_item_list 입력값 검증', { input });
    const validation: ValidationResult = await validateAladinItemListInput(input);
    if (!validation.isValid) {
      logger.warn('aladin_item_list 입력값 검증 실패', { errors: validation.errors, input });
      return formatMcpErrorResponse({
        code: 300,
        message: `입력값 검증 실패: ${validation.errors.join(', ')}`,
        timestamp: new Date().toISOString()
      });
    }

    // API 클라이언트 초기화
    const client = new AladinApiClient();

    // 조회 파라미터 준비
    const listParams = {
      QueryType: input.queryType,
      CategoryId: input.categoryId,
      SearchTarget: input.searchTarget,
      Start: input.start,
      MaxResults: input.maxResults,
      Cover: input.cover
    };

    logger.info('aladin_item_list API 호출', { listParams });

    // 알라딘 API 호출
    const response: ListResponse = await client.getItemList(listParams);

    // 응답 데이터 처리
    const formattedBooks = response.item.map(book => formatBookItem(book));

    const result = {
      books: formattedBooks,
      queryType: input.queryType,
      categoryId: input.categoryId,
      itemsPerPage: formattedBooks.length
    };

    const endTime = Date.now();
    logger.info('aladin_item_list 성공', {
      resultCount: formattedBooks.length,
      queryType: input.queryType,
      responseTime: endTime - startTime
    });

    return formatMcpSuccessResponse(result, {
      totalResults: formattedBooks.length,
      query: `${input.queryType} 목록`
    });

  } catch (error: any) {
    const endTime = Date.now();
    logger.error('aladin_item_list 실행 중 오류 발생', error, { input, responseTime: endTime - startTime });
    return formatMcpErrorResponse({
      code: error.code || 900,
      message: `추천/편집자 선택 목록 조회 중 오류가 발생했습니다: ${error.message}`,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * aladin_item_list 도구 메타데이터
 */
export const ALADIN_ITEM_LIST_TOOL = {
  name: 'aladin_item_list',
  description: '추천/편집자 선택 등 다양한 도서 목록을 조회합니다.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      queryType: {
        type: 'string' as const,
        enum: ['EditorChoice', 'ItemNewAll', 'ItemNewSpecial'],
        description: '목록 타입',
        default: 'EditorChoice'
      },
      categoryId: {
        type: 'number' as const,
        description: '카테고리 ID (선택사항)',
        minimum: 0,
        maximum: 99999
      },
      searchTarget: {
        type: 'string' as const,
        enum: ['Book', 'Foreign', 'eBook', 'Music', 'DVD'],
        description: '검색 대상',
        default: 'Book'
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
    },
    required: ['queryType']
  }
};