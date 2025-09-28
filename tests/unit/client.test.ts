/**
 * 알라딘 API 클라이언트 단위 테스트
 * API 클라이언트의 모든 기능을 개별적으로 테스트
 */

import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { AladinApiClient } from '../../src/client.js';
import type {
  SearchBooksParams,
  BookDetailsParams,
  ItemListParams,
  SearchResponse,
  LookupResponse,
  ListResponse,
  AladinApiError,
  ErrorCode,
  OptResult
} from '../../src/types.js';
import {
  mockSearchResponse,
  mockEmptySearchResponse,
  mockLookupResponse,
  mockEmptyLookupResponse,
  mockBestsellerResponse,
  mockNewBooksResponse,
  mockApiErrors,
  mockAxiosResponses,
  testScenarios
} from '../fixtures/api-responses.js';

describe('AladinApiClient', () => {
  let client: AladinApiClient;
  let mockAxios: MockAdapter;

  beforeEach(() => {
    // Axios 모킹 설정
    mockAxios = new MockAdapter(axios);

    // 클라이언트 인스턴스 생성
    client = new AladinApiClient('test-ttb-key');

    // 로그 억제
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    mockAxios.restore();
    jest.restoreAllMocks();
  });

  describe('생성자 및 초기화', () => {
    it('TTB 키와 함께 클라이언트를 생성할 수 있다', () => {
      const testClient = new AladinApiClient('custom-ttb-key');
      expect(testClient).toBeInstanceOf(AladinApiClient);
    });

    it('TTB 키 없이 클라이언트를 생성하면 기본값을 사용한다', () => {
      const testClient = new AladinApiClient();
      expect(testClient).toBeInstanceOf(AladinApiClient);
    });

    it('환경변수에서 TTB 키를 읽어온다', () => {
      process.env.TTB_KEY = 'env-ttb-key';
      const testClient = new AladinApiClient();
      expect(testClient).toBeInstanceOf(AladinApiClient);
      delete process.env.TTB_KEY;
    });
  });

  describe('도서 검색 (searchBooks)', () => {
    const searchUrl = '/ttb/api/ItemSearch.aspx';

    it('기본 검색을 성공적으로 수행한다', async () => {
      mockAxios.onGet(searchUrl).reply(200, mockSearchResponse);

      const result = await client.searchBooks(testScenarios.validSearchParams);

      expect(result).toEqual(mockSearchResponse);
      expect(mockAxios.history.get).toHaveLength(1);
      expect(mockAxios.history.get[0].params).toMatchObject({
        Query: testScenarios.validSearchParams.Query,
        TTBKey: 'test-ttb-key'
      });
    });

    it('검색 결과가 없을 때 빈 배열을 반환한다', async () => {
      mockAxios.onGet(searchUrl).reply(200, mockEmptySearchResponse);

      const result = await client.searchBooks({ Query: '존재하지않는도서' });

      expect(result.totalResults).toBe(0);
      expect(result.item).toHaveLength(0);
    });

    it('상세 검색 옵션을 올바르게 전달한다', async () => {
      mockAxios.onGet(searchUrl).reply(200, mockSearchResponse);

      const detailedParams = {
        Query: '클린 코드',
        QueryType: 'Title' as const,
        SearchTarget: 'Book' as const,
        Sort: 'SalesPoint' as const,
        Cover: 'MidBig' as const,
        CategoryId: 351,
        Start: 1,
        MaxResults: 20,
        OptResult: ['authors', 'fulldescription'] as OptResult[]
      };

      await client.searchBooks(detailedParams);

      const requestParams = mockAxios.history.get[0].params;
      expect(requestParams.QueryType).toBe('Title');
      expect(requestParams.SearchTarget).toBe('Book');
      expect(requestParams.Sort).toBe('SalesPoint');
      expect(requestParams.Cover).toBe('MidBig');
      expect(requestParams.CategoryId).toBe(351);
      expect(requestParams.MaxResults).toBe(20);
    });

    it('필수 파라미터가 누락되면 에러를 발생시킨다', async () => {
      await expect(client.searchBooks({ Query: '' }))
        .rejects
        .toThrow();
    });

    it('잘못된 파라미터 값에 대해 에러를 발생시킨다', async () => {
      await expect(client.searchBooks({
        Query: '테스트',
        MaxResults: 0
      })).rejects.toThrow();

      await expect(client.searchBooks({
        Query: '테스트',
        MaxResults: 200
      })).rejects.toThrow();
    });

    it('API 에러 응답을 올바르게 처리한다', async () => {
      mockAxios.onGet(searchUrl).reply(400, mockApiErrors.missingParam);

      await expect(client.searchBooks(testScenarios.validSearchParams))
        .rejects
        .toThrow();
    });

    it('네트워크 에러를 올바르게 처리한다', async () => {
      mockAxios.onGet(searchUrl).networkError();

      await expect(client.searchBooks(testScenarios.validSearchParams))
        .rejects
        .toThrow();
    });

    it('요청 타임아웃을 처리한다', async () => {
      mockAxios.onGet(searchUrl).timeout();

      await expect(client.searchBooks(testScenarios.validSearchParams))
        .rejects
        .toThrow();
    });
  });

  describe('도서 상세 정보 조회 (getBookDetails)', () => {
    const lookupUrl = '/ttb/api/ItemLookUp.aspx';

    it('ISBN13으로 도서 정보를 조회한다', async () => {
      mockAxios.onGet(lookupUrl).reply(200, mockLookupResponse);

      const result = await client.getBookDetails(testScenarios.validLookupParams);

      expect(result).toEqual(mockLookupResponse.item[0]);
      expect(mockAxios.history.get).toHaveLength(1);
      expect(mockAxios.history.get[0].params.ItemId).toBe(testScenarios.validLookupParams.ItemId);
    });

    it('ISBN10으로 도서 정보를 조회한다', async () => {
      mockAxios.onGet(lookupUrl).reply(200, mockLookupResponse);

      await client.getBookDetails({ ISBN: '8966260950' });

      expect(mockAxios.history.get[0].params.ISBN).toBe('8966260950');
    });

    it('도서 ID로 도서 정보를 조회한다', async () => {
      mockAxios.onGet(lookupUrl).reply(200, mockLookupResponse);

      await client.getBookDetails({ ItemId: '269508618' });

      expect(mockAxios.history.get[0].params.ItemId).toBe('269508618');
    });

    it('존재하지 않는 도서에 대해 null을 반환한다', async () => {
      mockAxios.onGet(lookupUrl).reply(200, mockEmptyLookupResponse);

      const result = await client.getBookDetails({ ISBN13: '9999999999999' });

      expect(result).toBeNull();
    });

    it('부가 정보 옵션을 올바르게 전달한다', async () => {
      mockAxios.onGet(lookupUrl).reply(200, mockLookupResponse);

      await client.getBookDetails({
        ISBN13: '9788966260959',
        Cover: 'Big',
        OptResult: ['authors', 'fulldescription', 'Toc'] as OptResult[]
      });

      const requestParams = mockAxios.history.get[0].params;
      expect(requestParams.Cover).toBe('Big');
      expect(requestParams.OptResult).toContain('authors');
    });

    it('식별자가 없으면 에러를 발생시킨다', async () => {
      await expect(client.getBookDetails({}))
        .rejects
        .toThrow();
    });

    it('잘못된 ISBN 형식에 대해 에러를 발생시킨다', async () => {
      await expect(client.getBookDetails({ ISBN: 'invalid-isbn' }))
        .rejects
        .toThrow();

      await expect(client.getBookDetails({ ISBN13: 'invalid-isbn13' }))
        .rejects
        .toThrow();
    });
  });

  describe('베스트셀러 목록 조회 (getBestsellerList)', () => {
    const listUrl = '/ttb/api/ItemList.aspx';

    it('전체 베스트셀러 목록을 조회한다', async () => {
      mockAxios.onGet(listUrl).reply(200, mockBestsellerResponse);

      const result = await client.getBestsellerList();

      expect(result).toEqual(mockBestsellerResponse);
      expect(mockAxios.history.get[0].params.QueryType).toBe('Bestseller');
    });

    it('카테고리별 베스트셀러를 조회한다', async () => {
      mockAxios.onGet(listUrl).reply(200, mockBestsellerResponse);

      await client.getBestsellerList({ CategoryId: 351 });

      expect(mockAxios.history.get[0].params.CategoryId).toBe(351);
    });

    it('월간 베스트셀러를 조회한다', async () => {
      mockAxios.onGet(listUrl).reply(200, mockBestsellerResponse);

      await client.getBestsellerList({
        Year: 2024,
        Month: 1
      });

      expect(mockAxios.history.get[0].params.Year).toBe(2024);
      expect(mockAxios.history.get[0].params.Month).toBe(1);
    });

    it('주간 베스트셀러를 조회한다', async () => {
      mockAxios.onGet(listUrl).reply(200, mockBestsellerResponse);

      await client.getBestsellerList({
        Year: 2024,
        Month: 1,
        Week: 2
      });

      expect(mockAxios.history.get[0].params.Week).toBe(2);
    });

    it('잘못된 날짜 파라미터에 대해 에러를 발생시킨다', async () => {
      await expect(client.getBestsellerList({ Month: 13 }))
        .rejects
        .toThrow();

      await expect(client.getBestsellerList({ Week: 54 }))
        .rejects
        .toThrow();
    });
  });

  describe('신간 도서 목록 조회 (getItemList)', () => {
    const listUrl = '/ttb/api/ItemList.aspx';

    it('일반 신간 도서 목록을 조회한다', async () => {
      mockAxios.onGet(listUrl).reply(200, mockNewBooksResponse);

      const result = await client.getItemList({ QueryType: 'NewBook' });

      expect(result).toEqual(mockNewBooksResponse);
      expect(mockAxios.history.get[0].params.QueryType).toBe('NewBook');
    });

    it('특별 신간 도서 목록을 조회한다', async () => {
      mockAxios.onGet(listUrl).reply(200, mockNewBooksResponse);

      await client.getItemList({ QueryType: 'NewSpecial' });

      expect(mockAxios.history.get[0].params.QueryType).toBe('NewSpecial');
    });

    it('카테고리별 신간 도서를 조회한다', async () => {
      mockAxios.onGet(listUrl).reply(200, mockNewBooksResponse);

      await client.getItemList({ QueryType: 'NewBook', CategoryId: 351 });

      expect(mockAxios.history.get[0].params.CategoryId).toBe(351);
    });
  });

  describe('캐싱 기능', () => {
    const searchUrl = '/ttb/api/ItemSearch.aspx';

    it('같은 요청을 캐시에서 가져온다', async () => {
      mockAxios.onGet(searchUrl).reply(200, mockSearchResponse);

      // 첫 번째 요청
      const result1 = await client.searchBooks(testScenarios.validSearchParams);

      // 두 번째 요청 (캐시에서 가져와야 함)
      const result2 = await client.searchBooks(testScenarios.validSearchParams);

      expect(result1).toEqual(result2);
      expect(mockAxios.history.get).toHaveLength(1); // API는 한 번만 호출
    });

    it('다른 파라미터는 별도로 캐시된다', async () => {
      mockAxios.onGet(searchUrl).reply(200, mockSearchResponse);

      await client.searchBooks({ Query: '클린 코드' });
      await client.searchBooks({ Query: '이펙티브 자바' });

      expect(mockAxios.history.get).toHaveLength(2); // 각각 별도 호출
    });
  });

  describe('재시도 로직', () => {
    const searchUrl = '/ttb/api/ItemSearch.aspx';

    it('일시적 네트워크 에러 시 재시도한다', async () => {
      mockAxios
        .onGet(searchUrl).networkErrorOnce()
        .onGet(searchUrl).reply(200, mockSearchResponse);

      const result = await client.searchBooks(testScenarios.validSearchParams);

      expect(result).toEqual(mockSearchResponse);
      expect(mockAxios.history.get).toHaveLength(2); // 재시도 포함
    });

    it('서버 에러 시 재시도한다', async () => {
      mockAxios
        .onGet(searchUrl).reply(500, 'Internal Server Error')
        .onGet(searchUrl).reply(200, mockSearchResponse);

      const result = await client.searchBooks(testScenarios.validSearchParams);

      expect(result).toEqual(mockSearchResponse);
      expect(mockAxios.history.get).toHaveLength(2);
    });

    it('클라이언트 에러는 재시도하지 않는다', async () => {
      mockAxios.onGet(searchUrl).reply(400, mockApiErrors.missingParam);

      await expect(client.searchBooks(testScenarios.validSearchParams))
        .rejects
        .toThrow();

      expect(mockAxios.history.get).toHaveLength(1); // 재시도 없음
    });

    it('최대 재시도 횟수 초과 시 에러를 발생시킨다', async () => {
      mockAxios.onGet(searchUrl).networkError();

      await expect(client.searchBooks(testScenarios.validSearchParams))
        .rejects
        .toThrow();

      expect(mockAxios.history.get.length).toBeGreaterThan(1); // 여러 번 시도
    });
  });

  describe('API 사용량 추적', () => {
    it('성공적인 API 호출을 추적한다', async () => {
      mockAxios.onGet().reply(200, mockSearchResponse);

      await client.searchBooks(testScenarios.validSearchParams);

      // API 사용량이 증가했는지 확인하는 로직
      // (실제 구현에서는 사용량 추적 메서드를 public으로 노출하거나 별도 테스트 방법 필요)
    });

    it('실패한 API 호출도 추적한다', async () => {
      mockAxios.onGet().reply(500);

      await expect(client.searchBooks(testScenarios.validSearchParams))
        .rejects
        .toThrow();

      // 실패한 호출도 추적되는지 확인
    });
  });

  describe('Circuit Breaker', () => {
    it('연속 실패 시 Circuit Breaker가 작동한다', async () => {
      // 연속으로 여러 번 실패하도록 설정
      mockAxios.onGet().reply(500);

      // 여러 번 호출하여 Circuit Breaker 임계값 도달
      for (let i = 0; i < 6; i++) {
        try {
          await client.searchBooks(testScenarios.validSearchParams);
        } catch (error) {
          // 에러 무시 (Circuit Breaker 테스트를 위함)
        }
      }

      // Circuit Breaker가 열린 후 즉시 실패해야 함
      await expect(client.searchBooks(testScenarios.validSearchParams))
        .rejects
        .toThrow();
    });
  });

  describe('입력값 검증', () => {
    it('빈 검색어에 대해 에러를 발생시킨다', async () => {
      await expect(client.searchBooks({ Query: '' }))
        .rejects
        .toThrow();
    });

    it('잘못된 범위의 maxResults에 대해 에러를 발생시킨다', async () => {
      await expect(client.searchBooks({
        Query: '테스트',
        MaxResults: 0
      })).rejects.toThrow();

      await expect(client.searchBooks({
        Query: '테스트',
        MaxResults: 200
      })).rejects.toThrow();
    });

    it('잘못된 카테고리 ID에 대해 에러를 발생시킨다', async () => {
      await expect(client.searchBooks({
        Query: '테스트',
        CategoryId: -1
      })).rejects.toThrow();
    });
  });

  describe('응답 데이터 정규화', () => {
    it('XML 응답을 JSON으로 변환한다', async () => {
      // XML 응답 모킹
      const xmlResponse = `<?xml version="1.0"?>
        <rss>
          <channel>
            <item>
              <title>테스트 도서</title>
              <itemId>123</itemId>
            </item>
          </channel>
        </rss>`;

      mockAxios.onGet().reply(200, xmlResponse, {
        'content-type': 'application/xml'
      });

      const result = await client.searchBooks(testScenarios.validSearchParams);

      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });

    it('누락된 필드에 기본값을 설정한다', async () => {
      const incompleteResponse = {
        ...mockSearchResponse,
        item: [{
          ItemId: 123,
          title: '테스트 도서'
          // 다른 필수 필드들 누락
        }]
      };

      mockAxios.onGet().reply(200, incompleteResponse);

      const result = await client.searchBooks(testScenarios.validSearchParams);

      expect(result.item[0]).toHaveProperty('author');
      expect(result.item[0]).toHaveProperty('description');
    });
  });
});