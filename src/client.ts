/**
 * 알라딘 OpenAPI 클라이언트
 *
 * 이 클라이언트는 알라딘 API의 모든 엔드포인트에 대한 인터페이스를 제공합니다.
 * - ItemSearch.aspx: 도서 검색
 * - ItemLookUp.aspx: 도서 상세 정보 조회
 * - ItemList.aspx: 베스트셀러/신간 목록 조회
 *
 * 주요 기능:
 * - 자동 재시도 로직 (지수 백오프)
 * - 에러 처리 및 표준화
 * - 일일 호출 한도 추적
 * - 응답 캐싱
 * - 입력값 검증
 */

import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import type {
  SearchBooksParams,
  BookDetailsParams,
  ItemListParams,
  SearchResponse,
  LookupResponse,
  ListResponse,
  CompleteBookItem,
  AladinApiError,
  StandardError,
  ErrorCode,
  ApiUsageStats,
  CacheEntry,
  ValidationResult
} from './types.js';
import {
  ALADIN_API_BASE_URL,
  API_ENDPOINTS,
  API_VERSION,
  DEFAULT_OUTPUT_FORMAT,
  DEFAULT_TTB_KEY,
  DAILY_API_LIMIT,
  HTTP_CONFIG,
  CACHE_CONFIG,
  ERROR_MESSAGES,
  CLIENT_ERROR_MESSAGES,
  VALIDATION_RULES
} from './constants/api.js';
import { getErrorHandler } from './utils/error-handler.js';
import { getRateLimiter, checkApiRateLimit, recordApiUsage } from './utils/rate-limiter.js';
import { getLogger } from './utils/logger.js';

/**
 * 알라딘 API 클라이언트 클래스
 */
export class AladinApiClient {
  private axios: AxiosInstance;
  private ttbKey: string;
  private apiUsage: ApiUsageStats;
  private cache: Map<string, CacheEntry<any>>;
  private circuitBreakerFailures: number = 0;
  private circuitBreakerLastFailure: Date | null = null;
  private readonly CIRCUIT_BREAKER_THRESHOLD = 5;
  private readonly CIRCUIT_BREAKER_TIMEOUT = 60000; // 1분
  private errorHandler = getErrorHandler();
  private rateLimiter = getRateLimiter();
  private logger = getLogger();

  constructor(ttbKey?: string) {
    this.ttbKey = ttbKey || process.env.TTB_KEY || DEFAULT_TTB_KEY;
    this.cache = new Map();
    this.apiUsage = {
      dailyCount: 0,
      dailyLimit: DAILY_API_LIMIT,
      lastReset: new Date(),
      lastCall: new Date()
    };

    // Axios 인스턴스 설정
    this.axios = axios.create({
      baseURL: ALADIN_API_BASE_URL,
      timeout: HTTP_CONFIG.TIMEOUT,
      headers: HTTP_CONFIG.HEADERS
    });

    // 요청 인터셉터 설정 (공통 파라미터 자동 추가)
    this.axios.interceptors.request.use(
      (config) => {
        // 공통 파라미터 추가
        if (!config.params) {
          config.params = {};
        }

        config.params.TTBKey = this.ttbKey;
        config.params.Version = API_VERSION;
        config.params.Output = DEFAULT_OUTPUT_FORMAT;

        return config;
      },
      (error) => {
        return Promise.reject(this.createStandardError(900, '요청 설정 오류', error));
      }
    );

    // 응답 인터셉터 설정 (에러 처리)
    this.axios.interceptors.response.use(
      (response) => {
        this.circuitBreakerFailures = 0; // 성공 시 실패 카운트 리셋
        return response;
      },
      (error) => {
        this.handleCircuitBreaker();
        return Promise.reject(this.handleApiError(error));
      }
    );
  }

  /**
   * 도서 검색 (ItemSearch.aspx)
   */
  async searchBooks(params: Omit<SearchBooksParams, 'TTBKey' | 'Version' | 'Output'>): Promise<SearchResponse> {
    const startTime = Date.now();
    const requestId = this.logger.logApiCallStart(API_ENDPOINTS.ITEM_SEARCH, params);

    try {
      // 입력값 검증
      const validation = this.validateSearchParams(params);
      if (!validation.isValid) {
        throw this.errorHandler.handleValidationError(validation);
      }

      // 캐시 확인
      const cacheKey = this.createCacheKey('search', params);
      const cached = this.getFromCache<SearchResponse>(cacheKey);
      if (cached) {
        this.logger.debug('캐시에서 검색 결과 반환', { cacheKey, requestId });
        return cached;
      }

      // API 호출 제한 확인
      await checkApiRateLimit(this.ttbKey);

      // Circuit Breaker 확인
      this.checkCircuitBreaker();

      const response = await this.retryRequest(() =>
        this.axios.get<SearchResponse>(API_ENDPOINTS.ITEM_SEARCH, { params })
      );

      const data = this.normalizeSearchResponse(response.data);

      // 캐시에 저장
      this.setCache(cacheKey, data, CACHE_CONFIG.SEARCH_TTL);

      // 성공 로깅
      const responseTime = Date.now() - startTime;
      this.logger.logApiCallEnd(requestId, API_ENDPOINTS.ITEM_SEARCH, params, responseTime, true);
      recordApiUsage(this.ttbKey, true, responseTime);

      return data;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const standardError = this.handleApiError(error);

      this.logger.logApiCallEnd(requestId, API_ENDPOINTS.ITEM_SEARCH, params, responseTime, false, standardError);
      recordApiUsage(this.ttbKey, false, responseTime);

      throw standardError;
    }
  }

  /**
   * 도서 상세 정보 조회 (ItemLookUp.aspx)
   */
  async getBookDetails(params: Omit<BookDetailsParams, 'TTBKey' | 'Version' | 'Output'>): Promise<CompleteBookItem | null> {
    const startTime = Date.now();
    const requestId = this.logger.logApiCallStart(API_ENDPOINTS.ITEM_LOOKUP, params);

    try {
      // 입력값 검증
      const validation = this.validateLookupParams(params);
      if (!validation.isValid) {
        throw this.errorHandler.handleValidationError(validation);
      }

      // 캐시 확인
      const cacheKey = this.createCacheKey('lookup', params);
      const cached = this.getFromCache<CompleteBookItem>(cacheKey);
      if (cached) {
        this.logger.debug('캐시에서 도서 상세 정보 반환', { cacheKey, requestId });
        return cached;
      }

      // API 호출 제한 확인
      await checkApiRateLimit(this.ttbKey);

      // Circuit Breaker 확인
      this.checkCircuitBreaker();

      const response = await this.retryRequest(() =>
        this.axios.get<LookupResponse>(API_ENDPOINTS.ITEM_LOOKUP, { params })
      );

      const normalizedResponse = this.normalizeLookupResponse(response.data);
      const data = normalizedResponse.item.length > 0 ? normalizedResponse.item[0] : null;

      // 캐시에 저장
      this.setCache(cacheKey, data, CACHE_CONFIG.LOOKUP_TTL);

      // 성공 로깅
      const responseTime = Date.now() - startTime;
      this.logger.logApiCallEnd(requestId, API_ENDPOINTS.ITEM_LOOKUP, params, responseTime, true);
      recordApiUsage(this.ttbKey, true, responseTime);

      return data;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const standardError = this.handleApiError(error);

      this.logger.logApiCallEnd(requestId, API_ENDPOINTS.ITEM_LOOKUP, params, responseTime, false, standardError);
      recordApiUsage(this.ttbKey, false, responseTime);

      throw standardError;
    }
  }

  /**
   * 베스트셀러 목록 조회 (ItemList.aspx - Bestseller)
   */
  async getBestsellerList(params: Omit<ItemListParams, 'TTBKey' | 'Version' | 'Output' | 'QueryType'> = {}): Promise<ListResponse> {
    const fullParams = { ...params, QueryType: 'Bestseller' as const };

    // 입력값 검증
    const validation = this.validateListParams(fullParams);
    if (!validation.isValid) {
      throw this.createStandardError(300, validation.errors.join(', '));
    }

    // 캐시 확인
    const cacheKey = this.createCacheKey('bestseller', fullParams);
    const cached = this.getFromCache<ListResponse>(cacheKey);
    if (cached) {
      return cached;
    }

    // API 호출 제한 확인
    await checkApiRateLimit(this.ttbKey);

    // Circuit Breaker 확인
    this.checkCircuitBreaker();

    try {
      const response = await this.retryRequest(() =>
        this.axios.get<ListResponse>(API_ENDPOINTS.ITEM_LIST, { params: fullParams })
      );

      const data = this.normalizeListResponse(response.data);

      // 캐시에 저장
      this.setCache(cacheKey, data, CACHE_CONFIG.LIST_TTL);

      return data;
    } catch (error) {
      throw this.handleApiError(error);
    }
  }

  /**
   * 신간 도서 목록 조회 (ItemList.aspx - NewBook/NewSpecial)
   */
  async getNewReleasesList(params: Omit<ItemListParams, 'TTBKey' | 'Version' | 'Output'> & { QueryType: 'NewBook' | 'NewSpecial' }): Promise<ListResponse> {
    // 입력값 검증
    const validation = this.validateListParams(params);
    if (!validation.isValid) {
      throw this.createStandardError(300, validation.errors.join(', '));
    }

    // 캐시 확인
    const cacheKey = this.createCacheKey('newreleases', params);
    const cached = this.getFromCache<ListResponse>(cacheKey);
    if (cached) {
      return cached;
    }

    // API 호출 제한 확인
    await checkApiRateLimit(this.ttbKey);

    // Circuit Breaker 확인
    this.checkCircuitBreaker();

    try {
      const response = await this.retryRequest(() =>
        this.axios.get<ListResponse>(API_ENDPOINTS.ITEM_LIST, { params })
      );

      const data = this.normalizeListResponse(response.data);

      // 캐시에 저장
      this.setCache(cacheKey, data, CACHE_CONFIG.LIST_TTL);

      return data;
    } catch (error) {
      throw this.handleApiError(error);
    }
  }

  /**
   * 아이템 목록 조회 (ItemList.aspx - 추천/편집자 선택 등)
   */
  async getItemList(params: Omit<ItemListParams, 'TTBKey' | 'Version' | 'Output'>): Promise<ListResponse> {
    // 입력값 검증
    const validation = this.validateListParams(params);
    if (!validation.isValid) {
      throw this.createStandardError(300, validation.errors.join(', '));
    }

    // 캐시 확인
    const cacheKey = this.createCacheKey('itemlist', params);
    const cached = this.getFromCache<ListResponse>(cacheKey);
    if (cached) {
      return cached;
    }

    // API 호출 제한 확인
    await checkApiRateLimit(this.ttbKey);

    // Circuit Breaker 확인
    this.checkCircuitBreaker();

    try {
      const response = await this.retryRequest(() =>
        this.axios.get<ListResponse>(API_ENDPOINTS.ITEM_LIST, { params })
      );

      const data = this.normalizeListResponse(response.data);

      // 캐시에 저장
      this.setCache(cacheKey, data, CACHE_CONFIG.LIST_TTL);

      return data;
    } catch (error) {
      throw this.handleApiError(error);
    }
  }

  // ===== 유틸리티 메서드 =====

  /**
   * TTB 키 유효성 검증
   */
  validateTtbKey(ttbKey: string): ValidationResult {
    const errors: string[] = [];

    if (!ttbKey) {
      errors.push('TTB 키가 필요합니다');
    } else if (!VALIDATION_RULES.TTB_KEY_PATTERN.test(ttbKey)) {
      errors.push('유효하지 않은 TTB 키 형식입니다');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * ISBN 형식 검증
   */
  validateIsbn(isbn: string): ValidationResult {
    const errors: string[] = [];

    if (!isbn) {
      errors.push('ISBN이 필요합니다');
    } else {
      const isValidIsbn10 = VALIDATION_RULES.ISBN_10_PATTERN.test(isbn);
      const isValidIsbn13 = VALIDATION_RULES.ISBN_13_PATTERN.test(isbn);

      if (!isValidIsbn10 && !isValidIsbn13) {
        errors.push('유효하지 않은 ISBN 형식입니다 (10자리 또는 13자리 숫자)');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 검색 파라미터 검증
   */
  private validateSearchParams(params: Omit<SearchBooksParams, 'TTBKey' | 'Version' | 'Output'>): ValidationResult {
    const errors: string[] = [];

    // Query 검증
    if (!params.Query) {
      errors.push('검색 키워드는 필수입니다');
    } else if (params.Query.length < VALIDATION_RULES.MIN_QUERY_LENGTH) {
      errors.push(`검색 키워드는 최소 ${VALIDATION_RULES.MIN_QUERY_LENGTH}자 이상이어야 합니다`);
    } else if (params.Query.length > VALIDATION_RULES.MAX_QUERY_LENGTH) {
      errors.push(`검색 키워드는 최대 ${VALIDATION_RULES.MAX_QUERY_LENGTH}자까지 입력 가능합니다`);
    }

    // CategoryId 검증
    if (params.CategoryId !== undefined) {
      if (params.CategoryId < VALIDATION_RULES.MIN_CATEGORY_ID || params.CategoryId > VALIDATION_RULES.MAX_CATEGORY_ID) {
        errors.push(`카테고리 ID는 ${VALIDATION_RULES.MIN_CATEGORY_ID}~${VALIDATION_RULES.MAX_CATEGORY_ID} 범위여야 합니다`);
      }
    }

    // 페이지네이션 검증
    if (params.Start !== undefined) {
      if (params.Start < VALIDATION_RULES.MIN_START || params.Start > VALIDATION_RULES.MAX_START) {
        errors.push(`시작 위치는 ${VALIDATION_RULES.MIN_START}~${VALIDATION_RULES.MAX_START} 범위여야 합니다`);
      }
    }

    if (params.MaxResults !== undefined) {
      if (params.MaxResults < VALIDATION_RULES.MIN_MAX_RESULTS || params.MaxResults > VALIDATION_RULES.MAX_MAX_RESULTS) {
        errors.push(`결과 개수는 ${VALIDATION_RULES.MIN_MAX_RESULTS}~${VALIDATION_RULES.MAX_MAX_RESULTS} 범위여야 합니다`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 상세 조회 파라미터 검증
   */
  private validateLookupParams(params: Omit<BookDetailsParams, 'TTBKey' | 'Version' | 'Output'>): ValidationResult {
    const errors: string[] = [];

    // ItemId, ISBN, ISBN13 중 최소 하나는 있어야 함
    if (!params.ItemId && !params.ISBN && !params.ISBN13) {
      errors.push('ItemId, ISBN, 또는 ISBN13 중 하나는 필수입니다');
    }

    // ISBN 검증
    if (params.ISBN) {
      const validation = this.validateIsbn(params.ISBN);
      if (!validation.isValid) {
        errors.push(...validation.errors);
      }
    }

    // ISBN13 검증
    if (params.ISBN13) {
      if (!VALIDATION_RULES.ISBN_13_PATTERN.test(params.ISBN13)) {
        errors.push('유효하지 않은 ISBN13 형식입니다');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 리스트 파라미터 검증
   */
  private validateListParams(params: Omit<ItemListParams, 'TTBKey' | 'Version' | 'Output'>): ValidationResult {
    const errors: string[] = [];

    // QueryType 검증
    if (!params.QueryType) {
      errors.push('QueryType은 필수입니다');
    }

    // CategoryId 검증
    if (params.CategoryId !== undefined) {
      if (params.CategoryId < VALIDATION_RULES.MIN_CATEGORY_ID || params.CategoryId > VALIDATION_RULES.MAX_CATEGORY_ID) {
        errors.push(`카테고리 ID는 ${VALIDATION_RULES.MIN_CATEGORY_ID}~${VALIDATION_RULES.MAX_CATEGORY_ID} 범위여야 합니다`);
      }
    }

    // 날짜 검증
    if (params.Year !== undefined) {
      if (params.Year < VALIDATION_RULES.MIN_YEAR || params.Year > VALIDATION_RULES.MAX_YEAR) {
        errors.push(`년도는 ${VALIDATION_RULES.MIN_YEAR}~${VALIDATION_RULES.MAX_YEAR} 범위여야 합니다`);
      }
    }

    if (params.Month !== undefined) {
      if (params.Month < VALIDATION_RULES.MIN_MONTH || params.Month > VALIDATION_RULES.MAX_MONTH) {
        errors.push(`월은 ${VALIDATION_RULES.MIN_MONTH}~${VALIDATION_RULES.MAX_MONTH} 범위여야 합니다`);
      }
    }

    if (params.Week !== undefined) {
      if (params.Week < VALIDATION_RULES.MIN_WEEK || params.Week > VALIDATION_RULES.MAX_WEEK) {
        errors.push(`주는 ${VALIDATION_RULES.MIN_WEEK}~${VALIDATION_RULES.MAX_WEEK} 범위여야 합니다`);
      }
    }

    // 페이지네이션 검증
    if (params.Start !== undefined) {
      if (params.Start < VALIDATION_RULES.MIN_START || params.Start > VALIDATION_RULES.MAX_START) {
        errors.push(`시작 위치는 ${VALIDATION_RULES.MIN_START}~${VALIDATION_RULES.MAX_START} 범위여야 합니다`);
      }
    }

    if (params.MaxResults !== undefined) {
      if (params.MaxResults < VALIDATION_RULES.MIN_MAX_RESULTS || params.MaxResults > VALIDATION_RULES.MAX_MAX_RESULTS) {
        errors.push(`결과 개수는 ${VALIDATION_RULES.MIN_MAX_RESULTS}~${VALIDATION_RULES.MAX_MAX_RESULTS} 범위여야 합니다`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * API 에러 처리
   */
  private handleApiError(error: any): StandardError {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;

      // 알라딘 API 에러 응답 처리
      if (axiosError.response?.data) {
        const apiError = axiosError.response.data as AladinApiError;
        if (apiError.errorCode) {
          return this.errorHandler.handleAladinApiError(apiError);
        }
      }

      // 네트워크 에러 처리
      if (axiosError.code) {
        return this.errorHandler.handleNetworkError(axiosError);
      }

      // HTTP 상태 코드 에러 처리
      const status = axiosError.response?.status;
      if (status) {
        return this.errorHandler.handleHttpStatusError(status, axiosError.response?.data);
      }
    }

    // 기타 에러
    return this.errorHandler.handleGenericError(error, 'API_CALL');
  }

  /**
   * 표준 에러 객체 생성
   */
  private createStandardError(code: ErrorCode, message: string, originalError?: any): StandardError {
    return {
      code,
      message,
      originalError,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 재시도 로직 (지수 백오프)
   */
  private async retryRequest<T>(
    requestFn: () => Promise<AxiosResponse<T>>,
    retries: number = HTTP_CONFIG.MAX_RETRIES
  ): Promise<AxiosResponse<T>> {
    const maxRetries = HTTP_CONFIG.MAX_RETRIES;
    const attempt = maxRetries - retries + 1;

    try {
      this.logger.debug('API 요청 시도', { attempt, retriesLeft: retries });
      return await requestFn();
    } catch (error) {
      // 에러 처리 및 재시도 가능 여부 확인
      const isRetryable = this.isRetryableError(error);
      const hasRetriesLeft = retries > 0;

      this.logger.warn('API 요청 실패', {
        attempt,
        retriesLeft: retries,
        isRetryable,
        error: error instanceof Error ? error.message : String(error)
      });

      if (hasRetriesLeft && isRetryable) {
        // 지수 백오프 계산 (개선된 지터 포함)
        const baseDelay = HTTP_CONFIG.RETRY_DELAY * Math.pow(HTTP_CONFIG.RETRY_MULTIPLIER, attempt - 1);
        const jitter = Math.random() * 0.1 * baseDelay; // 10% 지터
        const delay = Math.min(baseDelay + jitter, HTTP_CONFIG.MAX_RETRY_DELAY);

        this.logger.info('재시도 대기 중', {
          attempt,
          delayMs: Math.round(delay),
          nextAttempt: attempt + 1
        });

        await new Promise(resolve => setTimeout(resolve, delay));
        return this.retryRequest(requestFn, retries - 1);
      }

      // 재시도 불가능하거나 재시도 횟수 초과
      this.logger.error('재시도 실패 - 최종 포기', undefined, {
        totalAttempts: attempt,
        finalError: error instanceof Error ? error.message : String(error),
        isRetryable
      });

      throw error;
    }
  }

  /**
   * 재시도 가능한 에러인지 확인
   */
  private isRetryableError(error: any): boolean {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      // 5xx 서버 에러, 429 Rate Limit, 네트워크 에러는 재시도 가능
      return !status || status >= 500 || status === 429 ||
             error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.code === 'ECONNABORTED';
    }
    return false;
  }

  /**
   * Circuit Breaker 패턴 구현
   */
  private handleCircuitBreaker(): void {
    this.circuitBreakerFailures++;
    this.circuitBreakerLastFailure = new Date();
  }

  /**
   * Circuit Breaker 상태 확인
   */
  private checkCircuitBreaker(): void {
    if (this.circuitBreakerFailures >= this.CIRCUIT_BREAKER_THRESHOLD) {
      if (this.circuitBreakerLastFailure) {
        const timeSinceLastFailure = Date.now() - this.circuitBreakerLastFailure.getTime();
        if (timeSinceLastFailure < this.CIRCUIT_BREAKER_TIMEOUT) {
          throw this.createStandardError(900, '서비스가 일시적으로 차단되었습니다. 잠시 후 다시 시도해 주세요.');
        } else {
          // 타임아웃 후 Circuit Breaker 리셋
          this.circuitBreakerFailures = 0;
          this.circuitBreakerLastFailure = null;
        }
      }
    }
  }


  /**
   * 캐시 키 생성
   */
  private createCacheKey(prefix: string, params: any): string {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((result, key) => {
        result[key] = params[key];
        return result;
      }, {} as any);

    return `${CACHE_CONFIG.KEY_PREFIX}:${prefix}:${JSON.stringify(sortedParams)}`;
  }

  /**
   * 캐시에서 데이터 조회
   */
  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    // TTL 확인
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * 캐시에 데이터 저장
   */
  private setCache<T>(key: string, data: T, ttl: number): void {
    // 캐시 크기 제한
    if (this.cache.size >= CACHE_CONFIG.MAX_CACHE_SIZE) {
      // LRU: 가장 오래된 항목 제거
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  /**
   * 캐시 삭제
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * 검색 응답 정규화
   */
  private normalizeSearchResponse(response: SearchResponse): SearchResponse {
    // item 배열이 없으면 빈 배열로 초기화
    if (!response.item) {
      response.item = [];
    }

    // item 배열의 각 요소 정규화
    response.item = response.item.map(item => this.normalizeBookItem(item));

    return response;
  }

  /**
   * 상세 조회 응답 정규화
   */
  private normalizeLookupResponse(response: LookupResponse): LookupResponse {
    // item 배열이 없으면 빈 배열로 초기화
    if (!response.item) {
      response.item = [];
    }

    // item 배열의 각 요소 정규화
    response.item = response.item.map(item => this.normalizeBookItem(item));

    return response;
  }

  /**
   * 리스트 응답 정규화
   */
  private normalizeListResponse(response: ListResponse): ListResponse {
    // item 배열이 없으면 빈 배열로 초기화
    if (!response.item) {
      response.item = [];
    }

    // item 배열의 각 요소 정규화
    response.item = response.item.map(item => this.normalizeBookItem(item));

    return response;
  }

  /**
   * 도서 아이템 정규화
   */
  private normalizeBookItem(item: CompleteBookItem): CompleteBookItem {
    // 기본값 설정 및 타입 변환
    return {
      ...item,
      itemId: typeof item.itemId === 'string' ? parseInt(item.itemId) : (item.itemId || 0),
      title: item.title || '',
      author: item.author || '',
      publisher: item.publisher || '',
      pubDate: item.pubDate || '',
      description: item.description || '',
      isbn: item.isbn || '',
      isbn13: item.isbn13 || '',
      priceSales: typeof item.priceSales === 'string' ? parseInt(item.priceSales) : item.priceSales || 0,
      priceStandard: typeof item.priceStandard === 'string' ? parseInt(item.priceStandard) : item.priceStandard || 0,
      cover: item.cover || '',
      categoryId: typeof item.categoryId === 'string' ? parseInt(item.categoryId) : item.categoryId || 0,
      categoryName: item.categoryName || '',
      salesPoint: typeof item.salesPoint === 'string' ? parseInt(item.salesPoint) : item.salesPoint || 0,
      customerReviewRank: typeof item.customerReviewRank === 'string' ? parseFloat(item.customerReviewRank) : item.customerReviewRank || 0,
      adult: Boolean(item.adult),
      fixedPrice: Boolean(item.fixedPrice),
      mileage: typeof item.mileage === 'string' ? parseInt(item.mileage) : item.mileage || 0,
      stockStatus: item.stockStatus || '',
      mallType: item.mallType || '',
      link: item.link || ''
    };
  }

  /**
   * API 사용량 통계 조회
   */
  getApiUsageStats(): ApiUsageStats {
    return { ...this.apiUsage };
  }

  /**
   * TTB 키 변경
   */
  setTtbKey(ttbKey: string): void {
    const validation = this.validateTtbKey(ttbKey);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }
    this.ttbKey = ttbKey;
  }

  /**
   * TTB 키 조회
   */
  getTtbKey(): string {
    return this.ttbKey;
  }
}

/**
 * 기본 클라이언트 인스턴스 생성 및 내보내기
 */
export const defaultClient = new AladinApiClient();

/**
 * 클라이언트 팩토리 함수
 */
export function createAladinClient(ttbKey?: string): AladinApiClient {
  return new AladinApiClient(ttbKey);
}