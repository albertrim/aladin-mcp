/**
 * aladin_book_info MCP 도구
 *
 * ISBN 또는 상품 ID로 도서의 상세 정보를 조회합니다.
 */

import type {
  AladinBookInfoInput,
  McpToolResponse,
  LookupResponse,
  CompleteBookItem,
  ValidationResult
} from '../types.js';
import { AladinApiClient } from '../client.js';
import { validateAladinBookInfoInput } from '../utils/validators.js';
import { formatMcpSuccessResponse, formatMcpErrorResponse, formatBookItem } from '../utils/formatters.js';
import { getLogger } from '../utils/logger.js';

const logger = getLogger();

/**
 * aladin_book_info 도구 핸들러
 */
export async function handleAladinBookInfo(input: AladinBookInfoInput): Promise<McpToolResponse<{
  book: CompleteBookItem | null;
  found: boolean;
}>> {
  const startTime = Date.now();
  const identifier = input.itemId || input.isbn || input.isbn13 || 'unknown';

  try {
    // 입력값 검증
    logger.info('aladin_book_info 입력값 검증', { identifier });

    const validation: ValidationResult = await validateAladinBookInfoInput(input);
    if (!validation.isValid) {
      logger.warn('aladin_book_info 입력값 검증 실패', {
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

    // 조회 파라미터 준비
    const lookupParams = {
      ItemId: input.itemId,
      ISBN: input.isbn,
      ISBN13: input.isbn13,
      Cover: input.cover || 'Small',
      OptResult: input.optResult || ['authors', 'fulldescription']
    };

    logger.info('aladin_book_info API 요청', { lookupParams });

    // 알라딘 API 호출
    const response = await client.getBookDetails(lookupParams);

    // 응답 데이터 처리
    let book: CompleteBookItem | null = null;
    let found = false;

    if (response) {
      book = formatBookItem(response);
      found = true;
    }

    const result = {
      book,
      found
    };

    const endTime = Date.now();
    logger.info('aladin_book_info 성공', {
      found,
      bookTitle: book?.title || null,
      responseTime: endTime - startTime
    });

    return formatMcpSuccessResponse(result, {
      query: identifier
    });

  } catch (error: any) {
    const endTime = Date.now();

    logger.error('aladin_book_info 실행 중 오류 발생', error, {
      input,
      identifier,
      responseTime: endTime - startTime
    });

    return formatMcpErrorResponse({
      code: error.code || 900,
      message: `도서 정보 조회 중 오류가 발생했습니다: ${error.message}`,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * aladin_book_info 도구 메타데이터
 */
export const ALADIN_BOOK_INFO_TOOL = {
  name: 'aladin_book_info',
  description: 'ISBN 또는 상품 ID로 도서의 상세 정보를 조회합니다.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      itemId: {
        type: 'string' as const,
        description: '알라딘 상품 ID'
      },
      isbn: {
        type: 'string' as const,
        description: 'ISBN-10 또는 ISBN-13',
        pattern: '^(\\d{10}|\\d{13})$'
      },
      isbn13: {
        type: 'string' as const,
        description: 'ISBN-13',
        pattern: '^\\d{13}$'
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
        description: '부가 정보 옵션',
        default: ['authors', 'fulldescription']
      }
    },
    oneOf: [
      { required: ['itemId'] },
      { required: ['isbn'] },
      { required: ['isbn13'] }
    ]
  }
};