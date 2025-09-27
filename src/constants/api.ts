/**
 * 알라딘 OpenAPI 관련 상수 정의
 *
 * 알라딘 API 스펙:
 * - 기본 URL: http://www.aladin.co.kr/ttb/api/
 * - API 버전: 20070901 (고정)
 * - 일일 호출 한도: 5,000회
 * - TTB 키: ttbalbert.rim1712001
 */

import type {
  ApiVersion,
  OutputFormat,
  SearchTarget,
  QueryType,
  SortOption,
  CoverSize,
  OptResult,
  ListQueryType,
  ErrorCode,
  McpToolDefinition
} from '../types.js';

// ===== 기본 API 설정 =====

/**
 * 알라딘 API 기본 URL
 */
export const ALADIN_API_BASE_URL = 'http://www.aladin.co.kr/ttb/api';

/**
 * API 엔드포인트
 */
export const API_ENDPOINTS = {
  ITEM_SEARCH: 'ItemSearch.aspx',
  ITEM_LOOKUP: 'ItemLookUp.aspx',
  ITEM_LIST: 'ItemList.aspx'
} as const;

/**
 * API 버전 (고정값)
 */
export const API_VERSION: ApiVersion = '20070901';

/**
 * 기본 출력 형식
 */
export const DEFAULT_OUTPUT_FORMAT: OutputFormat = 'JS';

/**
 * 일일 API 호출 제한
 */
export const DAILY_API_LIMIT = 5000;

/**
 * 기본 TTB 키 (환경변수에서 설정)
 */
export const DEFAULT_TTB_KEY = 'ttbalbert.rim1712001';

// ===== 검색 관련 상수 =====

/**
 * 지원되는 검색 대상
 */
export const SEARCH_TARGETS: Record<SearchTarget, string> = {
  Book: '국내도서',
  Foreign: '외국도서',
  eBook: '전자책',
  Music: '음반',
  DVD: 'DVD'
} as const;

/**
 * 지원되는 쿼리 타입
 */
export const QUERY_TYPES: Record<QueryType, string> = {
  Title: '제목',
  Author: '저자',
  Publisher: '출판사',
  Keyword: '키워드'
} as const;

/**
 * 지원되는 정렬 옵션
 */
export const SORT_OPTIONS: Record<SortOption, string> = {
  Accuracy: '정확도순',
  PublishTime: '출간일순',
  Title: '제목순',
  SalesPoint: '판매량순',
  CustomerRating: '고객평점순'
} as const;

/**
 * 지원되는 표지 이미지 크기
 */
export const COVER_SIZES: Record<CoverSize, string> = {
  None: '표지없음',
  Small: '소형',
  MidBig: '중형',
  Big: '대형'
} as const;

/**
 * 지원되는 부가 정보 옵션
 */
export const OPT_RESULTS: Record<OptResult, string> = {
  authors: '저자정보',
  fulldescription: '상세설명',
  Toc: '목차',
  Story: '책소개',
  categoryIdList: '카테고리정보'
} as const;

/**
 * 지원되는 리스트 쿼리 타입
 */
export const LIST_QUERY_TYPES: Record<ListQueryType, string> = {
  Bestseller: '베스트셀러',
  NewBook: '신간도서',
  NewSpecial: '주목할만한 신간',
  EditorChoice: '편집자 추천',
  ItemNewAll: '신간 전체',
  ItemNewSpecial: '주목할만한 신간 전체'
} as const;

// ===== 기본값 설정 =====

/**
 * 검색 기본 파라미터
 */
export const DEFAULT_SEARCH_PARAMS = {
  QueryType: 'Title' as QueryType,
  SearchTarget: 'Book' as SearchTarget,
  Sort: 'Accuracy' as SortOption,
  Cover: 'Small' as CoverSize,
  Start: 1,
  MaxResults: 10,
  Version: API_VERSION,
  Output: DEFAULT_OUTPUT_FORMAT
} as const;

/**
 * 상세 조회 기본 파라미터
 */
export const DEFAULT_LOOKUP_PARAMS = {
  Cover: 'Small' as CoverSize,
  Version: API_VERSION,
  Output: DEFAULT_OUTPUT_FORMAT
} as const;

/**
 * 리스트 조회 기본 파라미터
 */
export const DEFAULT_LIST_PARAMS = {
  SearchTarget: 'Book' as SearchTarget,
  Cover: 'Small' as CoverSize,
  Start: 1,
  MaxResults: 10,
  Version: API_VERSION,
  Output: DEFAULT_OUTPUT_FORMAT
} as const;

// ===== 검증 규칙 =====

/**
 * 파라미터 검증 규칙
 */
export const VALIDATION_RULES = {
  // ISBN 검증 패턴
  ISBN_10_PATTERN: /^\d{9}[\dX]$/,
  ISBN_13_PATTERN: /^\d{13}$/,

  // TTB 키 패턴
  TTB_KEY_PATTERN: /^ttb[a-zA-Z0-9.]+$/,

  // 페이지네이션 제한
  MIN_START: 1,
  MAX_START: 1000,
  MIN_MAX_RESULTS: 1,
  MAX_MAX_RESULTS: 50,

  // 카테고리 ID 범위
  MIN_CATEGORY_ID: 0,
  MAX_CATEGORY_ID: 99999,

  // 쿼리 길이 제한
  MIN_QUERY_LENGTH: 1,
  MAX_QUERY_LENGTH: 200,

  // 날짜 범위 (년도)
  MIN_YEAR: 1900,
  MAX_YEAR: new Date().getFullYear() + 1,

  // 월 범위
  MIN_MONTH: 1,
  MAX_MONTH: 12,

  // 주 범위
  MIN_WEEK: 1,
  MAX_WEEK: 5
} as const;

// ===== 에러 메시지 =====

/**
 * 에러 코드별 메시지
 */
export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  [100]: '잘못된 TTB 키입니다. API 키를 확인해 주세요.',
  [200]: '필수 파라미터가 누락되었습니다.',
  [300]: '잘못된 파라미터 값입니다.',
  [900]: '시스템 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
  [901]: '일일 호출 한도(5,000회)를 초과했습니다. 내일 다시 시도해 주세요.'
} as const;

/**
 * 클라이언트 에러 메시지
 */
export const CLIENT_ERROR_MESSAGES = {
  NETWORK_ERROR: '네트워크 연결에 실패했습니다.',
  TIMEOUT_ERROR: '요청 시간이 초과되었습니다.',
  INVALID_RESPONSE: '유효하지 않은 응답 형식입니다.',
  RATE_LIMIT_EXCEEDED: 'API 호출 빈도 제한을 초과했습니다.',
  INVALID_PARAMETER: '유효하지 않은 파라미터입니다.',
  MISSING_PARAMETER: '필수 파라미터가 누락되었습니다.',
  INVALID_ISBN: '유효하지 않은 ISBN 형식입니다.',
  INVALID_CATEGORY: '유효하지 않은 카테고리 ID입니다.',
  INVALID_DATE: '유효하지 않은 날짜 형식입니다.'
} as const;

// ===== HTTP 설정 =====

/**
 * HTTP 요청 설정
 */
export const HTTP_CONFIG = {
  TIMEOUT: 10000, // 10초
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1초
  MAX_RETRY_DELAY: 8000, // 8초
  RETRY_MULTIPLIER: 2,

  // 헤더 설정
  HEADERS: {
    'User-Agent': 'Aladin-MCP-Server/1.0.0',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Encoding': 'gzip, deflate',
    'Connection': 'keep-alive'
  }
} as const;

// ===== 캐시 설정 =====

/**
 * 캐시 설정
 */
export const CACHE_CONFIG = {
  // TTL (Time To Live) 설정 (밀리초)
  SEARCH_TTL: 5 * 60 * 1000, // 5분
  LOOKUP_TTL: 30 * 60 * 1000, // 30분
  LIST_TTL: 10 * 60 * 1000, // 10분
  CATEGORY_TTL: 24 * 60 * 60 * 1000, // 24시간

  // 캐시 크기 제한
  MAX_CACHE_SIZE: 1000,

  // 캐시 키 접두사
  KEY_PREFIX: 'aladin_mcp'
} as const;

// ===== MCP 도구 스키마 =====

/**
 * aladin_search 도구 스키마
 */
export const ALADIN_SEARCH_SCHEMA: McpToolDefinition = {
  name: 'aladin_search',
  description: '알라딘에서 도서를 검색합니다. 키워드, 제목, 저자, 출판사로 검색할 수 있습니다.',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: '검색할 키워드 (필수)',
        minLength: VALIDATION_RULES.MIN_QUERY_LENGTH,
        maxLength: VALIDATION_RULES.MAX_QUERY_LENGTH
      },
      queryType: {
        type: 'string',
        enum: Object.keys(QUERY_TYPES),
        description: '검색 타입 (Title: 제목, Author: 저자, Publisher: 출판사, Keyword: 키워드)',
        default: 'Title'
      },
      searchTarget: {
        type: 'string',
        enum: Object.keys(SEARCH_TARGETS),
        description: '검색 대상 (Book: 국내도서, Foreign: 외국도서, eBook: 전자책)',
        default: 'Book'
      },
      sort: {
        type: 'string',
        enum: Object.keys(SORT_OPTIONS),
        description: '정렬 순서',
        default: 'Accuracy'
      },
      categoryId: {
        type: 'number',
        description: '카테고리 ID (선택사항)',
        minimum: VALIDATION_RULES.MIN_CATEGORY_ID,
        maximum: VALIDATION_RULES.MAX_CATEGORY_ID
      },
      start: {
        type: 'number',
        description: '검색 시작 위치',
        minimum: VALIDATION_RULES.MIN_START,
        maximum: VALIDATION_RULES.MAX_START,
        default: 1
      },
      maxResults: {
        type: 'number',
        description: '검색 결과 개수',
        minimum: VALIDATION_RULES.MIN_MAX_RESULTS,
        maximum: VALIDATION_RULES.MAX_MAX_RESULTS,
        default: 10
      }
    },
    required: ['query']
  }
};

/**
 * aladin_book_info 도구 스키마
 */
export const ALADIN_BOOK_INFO_SCHEMA: McpToolDefinition = {
  name: 'aladin_book_info',
  description: 'ISBN 또는 상품 ID로 도서의 상세 정보를 조회합니다.',
  inputSchema: {
    type: 'object',
    properties: {
      itemId: {
        type: 'string',
        description: '알라딘 상품 ID'
      },
      isbn: {
        type: 'string',
        description: 'ISBN-10 또는 ISBN-13',
        pattern: '^(\\d{10}|\\d{13})$'
      },
      isbn13: {
        type: 'string',
        description: 'ISBN-13',
        pattern: '^\\d{13}$'
      },
      cover: {
        type: 'string',
        enum: Object.keys(COVER_SIZES),
        description: '표지 이미지 크기',
        default: 'Small'
      },
      optResult: {
        type: 'array',
        items: {
          type: 'string',
          enum: Object.keys(OPT_RESULTS)
        },
        description: '부가 정보 옵션'
      }
    }
  }
};

/**
 * aladin_bestsellers 도구 스키마
 */
export const ALADIN_BESTSELLERS_SCHEMA: McpToolDefinition = {
  name: 'aladin_bestsellers',
  description: '분야별 베스트셀러 목록을 조회합니다.',
  inputSchema: {
    type: 'object',
    properties: {
      categoryId: {
        type: 'number',
        description: '카테고리 ID (0: 전체)',
        minimum: VALIDATION_RULES.MIN_CATEGORY_ID,
        maximum: VALIDATION_RULES.MAX_CATEGORY_ID,
        default: 0
      },
      searchTarget: {
        type: 'string',
        enum: Object.keys(SEARCH_TARGETS),
        description: '검색 대상',
        default: 'Book'
      },
      year: {
        type: 'number',
        description: '년도',
        minimum: VALIDATION_RULES.MIN_YEAR,
        maximum: VALIDATION_RULES.MAX_YEAR
      },
      month: {
        type: 'number',
        description: '월',
        minimum: VALIDATION_RULES.MIN_MONTH,
        maximum: VALIDATION_RULES.MAX_MONTH
      },
      week: {
        type: 'number',
        description: '주',
        minimum: VALIDATION_RULES.MIN_WEEK,
        maximum: VALIDATION_RULES.MAX_WEEK
      },
      start: {
        type: 'number',
        description: '시작 위치',
        minimum: VALIDATION_RULES.MIN_START,
        default: 1
      },
      maxResults: {
        type: 'number',
        description: '결과 개수',
        minimum: VALIDATION_RULES.MIN_MAX_RESULTS,
        maximum: VALIDATION_RULES.MAX_MAX_RESULTS,
        default: 10
      }
    }
  }
};

/**
 * aladin_new_books 도구 스키마
 */
export const ALADIN_NEW_BOOKS_SCHEMA: McpToolDefinition = {
  name: 'aladin_new_books',
  description: '신간 도서 목록을 조회합니다.',
  inputSchema: {
    type: 'object',
    properties: {
      queryType: {
        type: 'string',
        enum: ['NewBook', 'NewSpecial'],
        description: '신간 타입 (NewBook: 신간, NewSpecial: 주목할만한 신간)',
        default: 'NewBook'
      },
      categoryId: {
        type: 'number',
        description: '카테고리 ID',
        minimum: VALIDATION_RULES.MIN_CATEGORY_ID,
        maximum: VALIDATION_RULES.MAX_CATEGORY_ID
      },
      searchTarget: {
        type: 'string',
        enum: Object.keys(SEARCH_TARGETS),
        description: '검색 대상',
        default: 'Book'
      },
      start: {
        type: 'number',
        description: '시작 위치',
        minimum: VALIDATION_RULES.MIN_START,
        default: 1
      },
      maxResults: {
        type: 'number',
        description: '결과 개수',
        minimum: VALIDATION_RULES.MIN_MAX_RESULTS,
        maximum: VALIDATION_RULES.MAX_MAX_RESULTS,
        default: 10
      }
    }
  }
};

/**
 * aladin_categories 도구 스키마
 */
export const ALADIN_CATEGORIES_SCHEMA: McpToolDefinition = {
  name: 'aladin_categories',
  description: '카테고리 정보를 조회하거나 검색합니다.',
  inputSchema: {
    type: 'object',
    properties: {
      categoryName: {
        type: 'string',
        description: '카테고리명으로 검색'
      },
      categoryId: {
        type: 'number',
        description: '카테고리 ID로 조회',
        minimum: VALIDATION_RULES.MIN_CATEGORY_ID,
        maximum: VALIDATION_RULES.MAX_CATEGORY_ID
      },
      depth: {
        type: 'number',
        description: '카테고리 깊이 (1-5)',
        minimum: 1,
        maximum: 5
      }
    }
  }
};

/**
 * 모든 MCP 도구 스키마
 */
export const MCP_TOOL_SCHEMAS = {
  aladin_search: ALADIN_SEARCH_SCHEMA,
  aladin_book_info: ALADIN_BOOK_INFO_SCHEMA,
  aladin_bestsellers: ALADIN_BESTSELLERS_SCHEMA,
  aladin_new_books: ALADIN_NEW_BOOKS_SCHEMA,
  aladin_categories: ALADIN_CATEGORIES_SCHEMA
} as const;

// ===== 도구 목록 =====

/**
 * 지원되는 MCP 도구 목록
 */
export const SUPPORTED_TOOLS = Object.keys(MCP_TOOL_SCHEMAS);

/**
 * 도구별 설명
 */
export const TOOL_DESCRIPTIONS = {
  aladin_search: '키워드로 도서 검색',
  aladin_book_info: 'ISBN으로 도서 상세 정보 조회',
  aladin_bestsellers: '분야별 베스트셀러 목록 조회',
  aladin_new_books: '신간 도서 목록 조회',
  aladin_categories: '카테고리 정보 조회'
} as const;