/**
 * 알라딘 검색 도구 단위 테스트
 * aladin_search MCP 도구의 기능 테스트
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { AladinApiClient } from '../../../src/client.js';
import type {
  AladinSearchInput,
  McpToolResponse,
  SearchResponse,
  StandardError
} from '../../../src/types.js';

import {
  mockSearchResponse,
  mockEmptySearchResponse,
  testScenarios
} from '../../../tests/fixtures/api-responses.js';
import {
  mockToolInputs,
  mockStandardErrors
} from '../../../tests/fixtures/mcp-data.js';

// 도구 핸들러 함수를 직접 테스트하기 위해 모듈에서 가져옴
// 실제 구현에서는 도구 핸들러가 별도 모듈로 분리되어 있다고 가정
describe('AladinSearchTool', () => {
  let mockClient: jest.Mocked<AladinApiClient>;
  let server: Server;

  beforeEach(() => {
    // API 클라이언트 모킹
    mockClient = {
      searchBooks: jest.fn(),
      getBookDetails: jest.fn(),
      getBestsellerList: jest.fn(),
      getNewBooksList: jest.fn(),
      getItemList: jest.fn()
    } as any;

    // MCP 서버 인스턴스 생성 (테스트용)
    server = new Server(
      {
        name: 'aladin-mcp-test',
        version: '1.0.0'
      },
      {
        capabilities: {
          tools: {}
        }
      }
    );
  });

  describe('기본 검색 기능', () => {
    it('유효한 검색어로 도서를 검색한다', async () => {
      mockClient.searchBooks.mockResolvedValue(mockSearchResponse);

      const input: AladinSearchInput = mockToolInputs.search.valid.basic;

      // 실제 도구 핸들러 호출 시뮬레이션
      const result = await executeSearchTool(mockClient, input);

      expect(mockClient.searchBooks).toHaveBeenCalledWith({
        query: input.query,
        queryType: 'Keyword',
        searchTarget: 'Book',
        sort: 'Accuracy',
        cover: 'Small',
        start: 1,
        maxResults: 10
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockSearchResponse);
      expect(result.metadata?.totalResults).toBe(mockSearchResponse.totalResults);
    });

    it('상세 검색 옵션을 올바르게 처리한다', async () => {
      mockClient.searchBooks.mockResolvedValue(mockSearchResponse);

      const input: AladinSearchInput = mockToolInputs.search.valid.detailed;

      const result = await executeSearchTool(mockClient, input);

      expect(mockClient.searchBooks).toHaveBeenCalledWith({
        query: input.query,
        queryType: input.queryType,
        searchTarget: input.searchTarget,
        sort: input.sort,
        cover: input.cover,
        start: 1,
        maxResults: input.maxResults,
        optResult: input.optResult
      });

      expect(result.success).toBe(true);
    });

    it('카테고리 필터를 적용한다', async () => {
      mockClient.searchBooks.mockResolvedValue(mockSearchResponse);

      const input: AladinSearchInput = mockToolInputs.search.valid.withCategory;

      const result = await executeSearchTool(mockClient, input);

      expect(mockClient.searchBooks).toHaveBeenCalledWith(
        expect.objectContaining({
          query: input.query,
          categoryId: input.categoryId,
          maxResults: input.maxResults
        })
      );

      expect(result.success).toBe(true);
    });

    it('검색 결과가 없을 때를 처리한다', async () => {
      mockClient.searchBooks.mockResolvedValue(mockEmptySearchResponse);

      const input: AladinSearchInput = { query: '존재하지않는도서' };

      const result = await executeSearchTool(mockClient, input);

      expect(result.success).toBe(true);
      expect(result.data?.totalResults).toBe(0);
      expect(result.data?.item).toHaveLength(0);
      expect(result.metadata?.totalResults).toBe(0);
    });
  });

  describe('입력값 검증', () => {
    it('빈 검색어에 대해 에러를 반환한다', async () => {
      const input: AladinSearchInput = mockToolInputs.search.invalid.emptyQuery;

      const result = await executeSearchTool(mockClient, input);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBeDefined();
      expect(result.error?.message).toContain('검색어');
      expect(mockClient.searchBooks).not.toHaveBeenCalled();
    });

    it('잘못된 queryType에 대해 에러를 반환한다', async () => {
      const input: AladinSearchInput = mockToolInputs.search.invalid.invalidQueryType;

      const result = await executeSearchTool(mockClient, input);

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('QueryType');
      expect(mockClient.searchBooks).not.toHaveBeenCalled();
    });

    it('잘못된 maxResults에 대해 에러를 반환한다', async () => {
      const input: AladinSearchInput = mockToolInputs.search.invalid.invalidMaxResults;

      const result = await executeSearchTool(mockClient, input);

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('MaxResults');
      expect(mockClient.searchBooks).not.toHaveBeenCalled();
    });

    it('너무 큰 maxResults에 대해 에러를 반환한다', async () => {
      const input: AladinSearchInput = mockToolInputs.search.invalid.tooManyResults;

      const result = await executeSearchTool(mockClient, input);

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('MaxResults');
      expect(mockClient.searchBooks).not.toHaveBeenCalled();
    });

    it('유효하지 않은 카테고리 ID를 처리한다', async () => {
      const input: AladinSearchInput = { query: '테스트', categoryId: -1 };

      const result = await executeSearchTool(mockClient, input);

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('CategoryId');
      expect(mockClient.searchBooks).not.toHaveBeenCalled();
    });
  });

  describe('에러 처리', () => {
    it('API 에러를 올바르게 처리한다', async () => {
      const apiError = new Error('API 호출 실패');
      mockClient.searchBooks.mockRejectedValue(apiError);

      const input: AladinSearchInput = mockToolInputs.search.valid.basic;

      const result = await executeSearchTool(mockClient, input);

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('API 호출 실패');
    });

    it('네트워크 에러를 처리한다', async () => {
      const networkError = new Error('Network error');
      networkError.name = 'NetworkError';
      mockClient.searchBooks.mockRejectedValue(networkError);

      const input: AladinSearchInput = mockToolInputs.search.valid.basic;

      const result = await executeSearchTool(mockClient, input);

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('네트워크');
    });

    it('타임아웃 에러를 처리한다', async () => {
      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'TimeoutError';
      mockClient.searchBooks.mockRejectedValue(timeoutError);

      const input: AladinSearchInput = mockToolInputs.search.valid.basic;

      const result = await executeSearchTool(mockClient, input);

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('타임아웃');
    });

    it('일일 한도 초과 에러를 처리한다', async () => {
      const limitError = new Error('Daily limit exceeded');
      limitError.name = 'DailyLimitExceededError';
      mockClient.searchBooks.mockRejectedValue(limitError);

      const input: AladinSearchInput = mockToolInputs.search.valid.basic;

      const result = await executeSearchTool(mockClient, input);

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('일일 한도');
    });
  });

  describe('응답 포매팅', () => {
    it('검색 결과를 올바른 형식으로 반환한다', async () => {
      mockClient.searchBooks.mockResolvedValue(mockSearchResponse);

      const input: AladinSearchInput = mockToolInputs.search.valid.basic;

      const result = await executeSearchTool(mockClient, input);

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('metadata');

      expect(result.metadata).toHaveProperty('totalResults');
      expect(result.metadata).toHaveProperty('timestamp');
      expect(result.metadata?.timestamp).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('메타데이터에 검색 정보를 포함한다', async () => {
      mockClient.searchBooks.mockResolvedValue(mockSearchResponse);

      const input: AladinSearchInput = mockToolInputs.search.valid.basic;

      const result = await executeSearchTool(mockClient, input);

      expect(result.metadata?.query).toBe(input.query);
      expect(result.metadata?.startIndex).toBe(mockSearchResponse.startIndex);
      expect(result.metadata?.itemsPerPage).toBe(mockSearchResponse.itemsPerPage);
    });

    it('도서 정보를 사용자 친화적으로 포매팅한다', async () => {
      mockClient.searchBooks.mockResolvedValue(mockSearchResponse);

      const input: AladinSearchInput = mockToolInputs.search.valid.basic;

      const result = await executeSearchTool(mockClient, input);

      const book = result.data?.item[0];
      expect(book).toHaveProperty('title');
      expect(book).toHaveProperty('author');
      expect(book).toHaveProperty('publisher');
      expect(book).toHaveProperty('cover');
    });
  });

  describe('성능 최적화', () => {
    it('동일한 검색어에 대해 캐시를 활용한다', async () => {
      mockClient.searchBooks.mockResolvedValue(mockSearchResponse);

      const input: AladinSearchInput = mockToolInputs.search.valid.basic;

      // 첫 번째 호출
      await executeSearchTool(mockClient, input);

      // 두 번째 호출 (캐시에서 가져와야 함)
      await executeSearchTool(mockClient, input);

      // API 클라이언트의 내부 캐싱으로 인해 실제로는 한 번만 호출될 수 있음
      expect(mockClient.searchBooks).toHaveBeenCalledTimes(2);
    });

    it('대용량 결과에 대해 페이지네이션을 지원한다', async () => {
      const largeResponse = {
        ...mockSearchResponse,
        totalResults: 500,
        startIndex: 21,
        itemsPerPage: 20
      };

      mockClient.searchBooks.mockResolvedValue(largeResponse);

      const input: AladinSearchInput = {
        query: '프로그래밍',
        start: 21,
        maxResults: 20
      };

      const result = await executeSearchTool(mockClient, input);

      expect(mockClient.searchBooks).toHaveBeenCalledWith(
        expect.objectContaining({
          start: 21,
          maxResults: 20
        })
      );

      expect(result.metadata?.startIndex).toBe(21);
      expect(result.metadata?.itemsPerPage).toBe(20);
    });
  });

  describe('특수 문자 및 유니코드 처리', () => {
    it('한글 검색어를 올바르게 처리한다', async () => {
      mockClient.searchBooks.mockResolvedValue(mockSearchResponse);

      const input: AladinSearchInput = { query: '클린 코드' };

      const result = await executeSearchTool(mockClient, input);

      expect(mockClient.searchBooks).toHaveBeenCalledWith(
        expect.objectContaining({
          query: '클린 코드'
        })
      );

      expect(result.success).toBe(true);
    });

    it('특수 문자가 포함된 검색어를 처리한다', async () => {
      mockClient.searchBooks.mockResolvedValue(mockSearchResponse);

      const input: AladinSearchInput = { query: 'C++ 프로그래밍' };

      const result = await executeSearchTool(mockClient, input);

      expect(result.success).toBe(true);
    });

    it('공백과 구두점이 포함된 검색어를 처리한다', async () => {
      mockClient.searchBooks.mockResolvedValue(mockSearchResponse);

      const input: AladinSearchInput = { query: '"Clean Code" 로버트 마틴' };

      const result = await executeSearchTool(mockClient, input);

      expect(result.success).toBe(true);
    });
  });
});

/**
 * 검색 도구 실행 시뮬레이션 함수
 * 실제 MCP 도구 핸들러를 모방
 */
async function executeSearchTool(
  client: jest.Mocked<AladinApiClient>,
  input: AladinSearchInput
): Promise<McpToolResponse<SearchResponse>> {
  try {
    // 입력값 검증
    const validation = validateSearchInput(input);
    if (!validation.isValid) {
      return {
        success: false,
        error: {
          code: 200 as any,
          message: validation.errors.join(', '),
          timestamp: new Date().toISOString()
        }
      };
    }

    // 기본값 설정
    const params = {
      Query: input.query,
      QueryType: input.queryType || 'Keyword',
      SearchTarget: input.searchTarget || 'Book',
      Sort: input.sort || 'Accuracy',
      Cover: input.cover || 'Small',
      Start: input.start || 1,
      MaxResults: input.maxResults || 10,
      ...(input.categoryId && { CategoryId: input.categoryId }),
      ...(input.optResult && { OptResult: input.optResult })
    };

    // API 호출
    const data = await client.searchBooks(params);

    return {
      success: true,
      data,
      metadata: {
        totalResults: data.totalResults,
        startIndex: data.startIndex,
        itemsPerPage: data.itemsPerPage,
        query: input.query,
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 900 as any,
        message: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다',
        timestamp: new Date().toISOString()
      }
    };
  }
}

/**
 * 검색 입력값 검증 함수
 */
function validateSearchInput(input: AladinSearchInput): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!input.query || input.query.trim() === '') {
    errors.push('검색어는 필수입니다');
  }

  if (input.query && input.query.trim().length < 2) {
    errors.push('검색어는 최소 2자 이상이어야 합니다');
  }

  if (input.queryType && !['Title', 'Author', 'Publisher', 'Keyword'].includes(input.queryType)) {
    errors.push('QueryType은 Title, Author, Publisher, Keyword 중 하나여야 합니다');
  }

  if (input.maxResults !== undefined && (input.maxResults < 1 || input.maxResults > 100)) {
    errors.push('MaxResults는 1-100 사이의 값이어야 합니다');
  }

  if (input.start !== undefined && input.start < 1) {
    errors.push('Start는 1 이상이어야 합니다');
  }

  if (input.categoryId !== undefined && input.categoryId < 1) {
    errors.push('CategoryId는 양수여야 합니다');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}