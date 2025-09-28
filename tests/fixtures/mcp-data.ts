/**
 * MCP 도구 관련 테스트 데이터
 * Model Context Protocol 도구 입력/출력 및 서버 응답 모킹용 데이터
 */

import type {
  McpToolDefinition,
  McpToolResponse,
  AladinSearchInput,
  AladinBookInfoInput,
  AladinBestsellersInput,
  AladinNewBooksInput,
  AladinItemListInput,
  AladinCategoriesInput,
  ServerMetadata,
  ServerStatus,
  ApiUsageStats,
  StandardError
} from '../../src/types.js';

import { ErrorCode } from '../../src/types.js';

import {
  mockSearchResponse,
  mockLookupResponse,
  mockBestsellerResponse,
  mockNewBooksResponse,
  mockBookItem,
  mockBookItem2
} from './api-responses.js';

import {
  mockParsedCategories,
  mockCategorySearchResults
} from './category-data.js';

// ===== MCP 도구 정의 픽스처 =====

export const mockMcpTools: McpToolDefinition[] = [
  {
    name: 'aladin_search',
    description: '알라딘 도서 검색 - 키워드, 제목, 저자, 출판사로 도서를 검색합니다.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: '검색할 키워드 (필수)'
        },
        queryType: {
          type: 'string',
          enum: ['Title', 'Author', 'Publisher', 'Keyword'],
          description: '검색 유형',
          default: 'Keyword'
        },
        searchTarget: {
          type: 'string',
          enum: ['Book', 'Foreign', 'eBook', 'Music', 'DVD'],
          description: '검색 대상',
          default: 'Book'
        },
        sort: {
          type: 'string',
          enum: ['Accuracy', 'PublishTime', 'Title', 'SalesPoint', 'CustomerRating'],
          description: '정렬 기준',
          default: 'Accuracy'
        },
        cover: {
          type: 'string',
          enum: ['None', 'Small', 'MidBig', 'Big'],
          description: '표지 이미지 크기',
          default: 'Small'
        },
        categoryId: {
          type: 'number',
          description: '카테고리 ID로 검색 범위 제한'
        },
        start: {
          type: 'number',
          description: '검색 시작 위치 (1부터 시작)',
          default: 1,
          minimum: 1
        },
        maxResults: {
          type: 'number',
          description: '최대 결과 수',
          default: 10,
          minimum: 1,
          maximum: 100
        },
        optResult: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['authors', 'fulldescription', 'Toc', 'Story', 'categoryIdList']
          },
          description: '추가 정보 옵션'
        }
      },
      required: ['query']
    }
  },
  {
    name: 'aladin_book_info',
    description: '알라딘 도서 상세 정보 조회 - ISBN 또는 도서 ID로 상세 정보를 조회합니다.',
    inputSchema: {
      type: 'object',
      properties: {
        itemId: {
          type: 'string',
          description: '알라딘 도서 ID'
        },
        isbn: {
          type: 'string',
          description: 'ISBN-10'
        },
        isbn13: {
          type: 'string',
          description: 'ISBN-13'
        },
        cover: {
          type: 'string',
          enum: ['None', 'Small', 'MidBig', 'Big'],
          description: '표지 이미지 크기',
          default: 'Small'
        },
        optResult: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['authors', 'fulldescription', 'Toc', 'Story', 'categoryIdList']
          },
          description: '추가 정보 옵션'
        }
      },
      required: []
    }
  },
  {
    name: 'aladin_bestsellers',
    description: '알라딘 베스트셀러 목록 조회 - 분야별 베스트셀러 목록을 조회합니다.',
    inputSchema: {
      type: 'object',
      properties: {
        categoryId: {
          type: 'number',
          description: '카테고리 ID'
        },
        searchTarget: {
          type: 'string',
          enum: ['Book', 'Foreign', 'eBook', 'Music', 'DVD'],
          description: '검색 대상',
          default: 'Book'
        },
        year: {
          type: 'number',
          description: '연도 (최근 3년 이내)'
        },
        month: {
          type: 'number',
          description: '월 (1-12)'
        },
        week: {
          type: 'number',
          description: '주 (1-53)'
        },
        start: {
          type: 'number',
          description: '검색 시작 위치',
          default: 1,
          minimum: 1
        },
        maxResults: {
          type: 'number',
          description: '최대 결과 수',
          default: 10,
          minimum: 1,
          maximum: 100
        },
        cover: {
          type: 'string',
          enum: ['None', 'Small', 'MidBig', 'Big'],
          description: '표지 이미지 크기',
          default: 'Small'
        }
      },
      required: []
    }
  },
  {
    name: 'aladin_new_books',
    description: '알라딘 신간 도서 목록 조회 - 최신 출간 도서 목록을 조회합니다.',
    inputSchema: {
      type: 'object',
      properties: {
        queryType: {
          type: 'string',
          enum: ['NewBook', 'NewSpecial'],
          description: '신간 유형',
          default: 'NewBook'
        },
        categoryId: {
          type: 'number',
          description: '카테고리 ID'
        },
        searchTarget: {
          type: 'string',
          enum: ['Book', 'Foreign', 'eBook', 'Music', 'DVD'],
          description: '검색 대상',
          default: 'Book'
        },
        start: {
          type: 'number',
          description: '검색 시작 위치',
          default: 1,
          minimum: 1
        },
        maxResults: {
          type: 'number',
          description: '최대 결과 수',
          default: 10,
          minimum: 1,
          maximum: 100
        },
        cover: {
          type: 'string',
          enum: ['None', 'Small', 'MidBig', 'Big'],
          description: '표지 이미지 크기',
          default: 'Small'
        }
      },
      required: []
    }
  },
  {
    name: 'aladin_categories',
    description: '알라딘 카테고리 검색 - 카테고리 정보를 검색하고 조회합니다.',
    inputSchema: {
      type: 'object',
      properties: {
        categoryName: {
          type: 'string',
          description: '검색할 카테고리 이름'
        },
        categoryId: {
          type: 'number',
          description: '조회할 카테고리 ID'
        },
        depth: {
          type: 'number',
          description: '카테고리 뎁스 필터 (1-5)',
          minimum: 1,
          maximum: 5
        }
      },
      required: []
    }
  }
];

// ===== MCP 도구 입력 데이터 픽스처 =====

export const mockToolInputs = {
  search: {
    valid: {
      basic: {
        query: '클린 코드'
      } as AladinSearchInput,
      detailed: {
        query: '이펙티브 자바',
        queryType: 'Title' as const,
        searchTarget: 'Book' as const,
        sort: 'SalesPoint' as const,
        cover: 'MidBig' as const,
        maxResults: 20,
        optResult: ['authors', 'fulldescription']
      } as AladinSearchInput,
      withCategory: {
        query: '프로그래밍',
        categoryId: 351,
        maxResults: 5
      } as AladinSearchInput
    },
    invalid: {
      emptyQuery: { query: '' } as AladinSearchInput,
      invalidQueryType: { query: '테스트', queryType: 'InvalidType' as any } as AladinSearchInput,
      invalidMaxResults: { query: '테스트', maxResults: 0 } as AladinSearchInput,
      tooManyResults: { query: '테스트', maxResults: 200 } as AladinSearchInput
    }
  },
  bookInfo: {
    valid: {
      byIsbn13: {
        isbn13: '9788966260959'
      } as AladinBookInfoInput,
      byIsbn: {
        isbn: '8966260950'
      } as AladinBookInfoInput,
      byItemId: {
        itemId: '269508618'
      } as AladinBookInfoInput,
      withOptions: {
        isbn13: '9788966260959',
        cover: 'Big' as const,
        optResult: ['authors', 'fulldescription', 'Toc']
      } as AladinBookInfoInput
    },
    invalid: {
      noIdentifier: {} as AladinBookInfoInput,
      invalidIsbn: { isbn: 'invalid-isbn' } as AladinBookInfoInput,
      invalidIsbn13: { isbn13: 'invalid-isbn13' } as AladinBookInfoInput,
      emptyItemId: { itemId: '' } as AladinBookInfoInput
    }
  },
  bestsellers: {
    valid: {
      basic: {} as AladinBestsellersInput,
      withCategory: {
        categoryId: 351
      } as AladinBestsellersInput,
      monthly: {
        categoryId: 50,
        year: 2024,
        month: 1
      } as AladinBestsellersInput,
      weekly: {
        year: 2024,
        month: 1,
        week: 2
      } as AladinBestsellersInput
    },
    invalid: {
      invalidCategory: { categoryId: -1 } as AladinBestsellersInput,
      invalidYear: { year: 2020 } as AladinBestsellersInput,
      invalidMonth: { month: 13 } as AladinBestsellersInput,
      invalidWeek: { week: 54 } as AladinBestsellersInput
    }
  },
  newBooks: {
    valid: {
      basic: {} as AladinNewBooksInput,
      newSpecial: {
        queryType: 'NewSpecial' as const
      } as AladinNewBooksInput,
      withCategory: {
        categoryId: 351,
        maxResults: 15
      } as AladinNewBooksInput
    },
    invalid: {
      invalidQueryType: { queryType: 'InvalidType' as any } as AladinNewBooksInput,
      invalidCategory: { categoryId: -1 } as AladinNewBooksInput
    }
  },
  categories: {
    valid: {
      searchByName: {
        categoryName: '프로그래밍'
      } as AladinCategoriesInput,
      searchById: {
        categoryId: 351
      } as AladinCategoriesInput,
      searchByDepth: {
        depth: 3
      } as AladinCategoriesInput,
      combined: {
        categoryName: '소설',
        depth: 2
      } as AladinCategoriesInput
    },
    invalid: {
      emptyName: { categoryName: '' } as AladinCategoriesInput,
      invalidDepth: { depth: 0 } as AladinCategoriesInput,
      tooDeepDepth: { depth: 10 } as AladinCategoriesInput
    }
  }
};

// ===== MCP 도구 응답 픽스처 =====

export const mockToolResponses = {
  search: {
    success: {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            success: true,
            data: mockSearchResponse,
            metadata: {
              totalResults: 1,
              startIndex: 1,
              itemsPerPage: 10,
              query: '클린 코드',
              timestamp: '2024-01-15T10:30:00+09:00'
            }
          } as McpToolResponse, null, 2)
        }
      ]
    },
    empty: {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            success: true,
            data: { ...mockSearchResponse, totalResults: 0, item: [] },
            metadata: {
              totalResults: 0,
              startIndex: 1,
              itemsPerPage: 10,
              query: '존재하지않는도서',
              timestamp: '2024-01-15T10:30:00+09:00'
            }
          } as McpToolResponse, null, 2)
        }
      ]
    },
    error: {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            success: false,
            error: {
              code: ErrorCode.MISSING_REQUIRED_PARAM,
              message: '필수 파라미터가 누락되었습니다: query',
              timestamp: '2024-01-15T10:30:00+09:00'
            }
          } as McpToolResponse, null, 2)
        }
      ]
    }
  },
  bookInfo: {
    success: {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            success: true,
            data: mockBookItem,
            metadata: {
              timestamp: '2024-01-15T10:30:00+09:00'
            }
          } as McpToolResponse, null, 2)
        }
      ]
    },
    notFound: {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            success: true,
            data: null,
            metadata: {
              timestamp: '2024-01-15T10:30:00+09:00'
            }
          } as McpToolResponse, null, 2)
        }
      ]
    }
  },
  bestsellers: {
    success: {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            success: true,
            data: mockBestsellerResponse,
            metadata: {
              timestamp: '2024-01-15T10:30:00+09:00'
            }
          } as McpToolResponse, null, 2)
        }
      ]
    }
  },
  newBooks: {
    success: {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            success: true,
            data: mockNewBooksResponse,
            metadata: {
              timestamp: '2024-01-15T10:30:00+09:00'
            }
          } as McpToolResponse, null, 2)
        }
      ]
    }
  },
  categories: {
    success: {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            success: true,
            data: mockCategorySearchResults.programming,
            metadata: {
              timestamp: '2024-01-15T10:30:00+09:00'
            }
          } as McpToolResponse, null, 2)
        }
      ]
    },
    notFound: {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            success: true,
            data: mockCategorySearchResults.notFound,
            metadata: {
              timestamp: '2024-01-15T10:30:00+09:00'
            }
          } as McpToolResponse, null, 2)
        }
      ]
    }
  }
};

// ===== 서버 메타데이터 및 상태 픽스처 =====

export const mockServerMetadata: ServerMetadata = {
  name: 'aladin-mcp',
  version: '1.0.0',
  description: '알라딘 OpenAPI용 MCP 서버 - Node.js와 TypeScript 기반 도서 정보 조회 시스템',
  apiVersion: '20070901',
  supportedTools: [
    'aladin_search',
    'aladin_book_info',
    'aladin_bestsellers',
    'aladin_new_books',
    'aladin_categories'
  ]
};

export const mockApiUsageStats: ApiUsageStats = {
  dailyCount: 150,
  dailyLimit: 5000,
  lastReset: new Date('2024-01-15T00:00:00+09:00'),
  lastCall: new Date('2024-01-15T10:30:00+09:00')
};

export const mockServerStatus: ServerStatus = {
  isHealthy: true,
  uptime: 3600000, // 1시간 (밀리초)
  apiUsage: mockApiUsageStats
};

export const mockUnhealthyServerStatus: ServerStatus = {
  isHealthy: false,
  uptime: 7200000, // 2시간
  apiUsage: {
    ...mockApiUsageStats,
    dailyCount: 5000 // 한도 도달
  },
  lastError: {
    code: ErrorCode.DAILY_LIMIT_EXCEEDED,
    message: '일일 API 호출 한도를 초과했습니다',
    timestamp: '2024-01-15T10:30:00+09:00'
  }
};

// ===== 표준 에러 픽스처 =====

export const mockStandardErrors: Record<string, StandardError> = {
  validationError: {
    code: ErrorCode.INVALID_PARAM_VALUE,
    message: '유효하지 않은 파라미터 값입니다',
    timestamp: '2024-01-15T10:30:00+09:00'
  },
  missingParam: {
    code: ErrorCode.MISSING_REQUIRED_PARAM,
    message: '필수 파라미터가 누락되었습니다',
    timestamp: '2024-01-15T10:30:00+09:00'
  },
  invalidTtbKey: {
    code: ErrorCode.INVALID_TTB_KEY,
    message: '유효하지 않은 TTB 키입니다',
    timestamp: '2024-01-15T10:30:00+09:00'
  },
  dailyLimitExceeded: {
    code: ErrorCode.DAILY_LIMIT_EXCEEDED,
    message: '일일 API 호출 한도를 초과했습니다',
    timestamp: '2024-01-15T10:30:00+09:00'
  },
  systemError: {
    code: ErrorCode.SYSTEM_ERROR,
    message: '시스템 에러가 발생했습니다',
    timestamp: '2024-01-15T10:30:00+09:00'
  }
};

// ===== MCP 프로토콜 메시지 픽스처 =====

export const mockMcpMessages = {
  initialize: {
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      clientInfo: {
        name: 'Claude Desktop',
        version: '1.0.0'
      },
      capabilities: {}
    }
  },
  listTools: {
    method: 'tools/list',
    params: {}
  },
  callTool: {
    search: {
      method: 'tools/call',
      params: {
        name: 'aladin_search',
        arguments: mockToolInputs.search.valid.basic
      }
    },
    bookInfo: {
      method: 'tools/call',
      params: {
        name: 'aladin_book_info',
        arguments: mockToolInputs.bookInfo.valid.byIsbn13
      }
    }
  }
};

// ===== 테스트 시나리오 조합 =====

export const mcpTestScenarios = {
  toolValidation: {
    allToolsValid: mockMcpTools.map(tool => ({
      tool,
      validInputs: Object.values((mockToolInputs as any)[tool.name.replace('aladin_', '')]?.valid || {}),
      invalidInputs: Object.values((mockToolInputs as any)[tool.name.replace('aladin_', '')]?.invalid || {})
    }))
  },
  serverLifecycle: {
    initialization: ['initialize', 'initialized'],
    toolDiscovery: ['tools/list'],
    toolExecution: ['tools/call'],
    shutdown: ['shutdown']
  },
  errorHandling: {
    networkErrors: ['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND'],
    apiErrors: Object.keys(mockStandardErrors),
    validationErrors: ['emptyQuery', 'invalidCategory', 'invalidIsbn']
  }
};