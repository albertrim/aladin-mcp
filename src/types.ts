/**
 * 알라딘 OpenAPI MCP 서버용 타입 정의
 *
 * 알라딘 API 스펙:
 * - Version: 20070901
 * - 응답 형식: XML, JSON
 * - 일일 호출 한도: 5,000회
 */

// ===== 기본 타입 정의 =====

/**
 * API 버전 타입
 */
export type ApiVersion = '20070901';

/**
 * 출력 형식 타입
 */
export type OutputFormat = 'XML' | 'JS';

/**
 * 검색 대상 타입
 */
export type SearchTarget = 'Book' | 'Foreign' | 'eBook' | 'Music' | 'DVD';

/**
 * 검색 쿼리 타입
 */
export type QueryType = 'Title' | 'Author' | 'Publisher' | 'Keyword';

/**
 * 정렬 옵션 타입
 */
export type SortOption = 'Accuracy' | 'PublishTime' | 'Title' | 'SalesPoint' | 'CustomerRating';

/**
 * 표지 이미지 크기 타입
 */
export type CoverSize = 'None' | 'Small' | 'MidBig' | 'Big';

/**
 * 부가 정보 옵션 타입
 */
export type OptResult = 'authors' | 'fulldescription' | 'Toc' | 'Story' | 'categoryIdList';

/**
 * 리스트 쿼리 타입 (베스트셀러/신간 등)
 */
export type ListQueryType =
  | 'Bestseller'
  | 'NewBook'
  | 'NewSpecial'
  | 'EditorChoice'
  | 'ItemNewAll'
  | 'ItemNewSpecial';

/**
 * 기간 타입 (베스트셀러 등에서 사용)
 */
export type PeriodType = 'Daily' | 'Weekly' | 'Monthly';

// ===== 검색 파라미터 타입 =====

/**
 * 공통 API 파라미터
 */
export interface BaseApiParams {
  TTBKey: string;
  Version: ApiVersion;
  Output?: OutputFormat;
}

/**
 * 페이지네이션 파라미터
 */
export interface PaginationParams {
  Start?: number;
  MaxResults?: number;
}

/**
 * 도서 검색 파라미터 (ItemSearch.aspx)
 */
export interface SearchBooksParams extends BaseApiParams, PaginationParams {
  Query: string;
  QueryType?: QueryType;
  SearchTarget?: SearchTarget;
  Sort?: SortOption;
  Cover?: CoverSize;
  CategoryId?: number;
  OptResult?: OptResult[];
}

/**
 * 도서 상세 조회 파라미터 (ItemLookUp.aspx)
 */
export interface BookDetailsParams extends BaseApiParams {
  ItemId?: string;
  ISBN?: string;
  ISBN13?: string;
  Cover?: CoverSize;
  OptResult?: OptResult[];
}

/**
 * 리스트 조회 파라미터 (ItemList.aspx)
 */
export interface ItemListParams extends BaseApiParams, PaginationParams {
  QueryType: ListQueryType;
  SearchTarget?: SearchTarget;
  CategoryId?: number;
  Cover?: CoverSize;
  Year?: number;
  Month?: number;
  Week?: number;
}

// ===== 알라딘 API 응답 타입 =====

/**
 * 기본 도서 정보
 */
export interface BookItem {
  itemId: number;
  title: string;
  link: string;
  author: string;
  pubDate: string;
  description: string;
  isbn: string;
  isbn13: string;
  priceSales: number;
  priceStandard: number;
  mallType: string;
  stockStatus: string;
  mileage: number;
  cover: string;
  categoryId: number;
  categoryName: string;
  publisher: string;
  salesPoint: number;
  adult: boolean;
  fixedPrice: boolean;
  customerReviewRank: number;
  bestDuration?: string;
  bestRank?: number;
}

/**
 * 서브 정보 (부가 정보)
 */
export interface SubInfo {
  authors?: Author[];
  fulldescription?: string;
  toc?: string;
  story?: string;
  categoryIdList?: CategoryInfo[];
  ratingInfo?: RatingInfo;
  bestSellerRank?: BestSellerRank[];
  cardPromotionList?: CardPromotion[];
  packList?: PackItem[];
}

/**
 * 저자 정보
 */
export interface Author {
  authorId: number;
  authorName: string;
  authorType: string;
  authorInfo: string;
}

/**
 * 카테고리 정보
 */
export interface CategoryInfo {
  categoryId: number;
  categoryName: string;
  categoryDepth: number;
}

/**
 * 평점 정보
 */
export interface RatingInfo {
  ratingScore: number;
  ratingCount: number;
  commentReviewCount: number;
  myReviewCount: number;
}

/**
 * 베스트셀러 순위 정보
 */
export interface BestSellerRank {
  categoryId: number;
  categoryName: string;
  bestRank: number;
  period: string;
}

/**
 * 카드 프로모션 정보
 */
export interface CardPromotion {
  cardCompany: string;
  cardType: string;
  discountAmount: number;
  discountRate: number;
}

/**
 * 패키지 아이템
 */
export interface PackItem {
  itemId: number;
  title: string;
  author: string;
  cover: string;
}

/**
 * 완전한 도서 정보 (SubInfo 포함)
 */
export interface CompleteBookItem extends BookItem {
  subInfo?: SubInfo;
}

/**
 * 검색 응답 (ItemSearch)
 */
export interface SearchResponse {
  version: string;
  title: string;
  link: string;
  pubDate: string;
  totalResults: number;
  startIndex: number;
  itemsPerPage: number;
  query: string;
  item: CompleteBookItem[];
}

/**
 * 상세 조회 응답 (ItemLookUp)
 */
export interface LookupResponse {
  version: string;
  title: string;
  link: string;
  pubDate: string;
  item: CompleteBookItem[];
}

/**
 * 리스트 조회 응답 (ItemList)
 */
export interface ListResponse {
  version: string;
  title: string;
  link: string;
  pubDate: string;
  item: CompleteBookItem[];
}

// ===== 에러 응답 타입 =====

/**
 * 알라딘 API 에러 응답
 */
export interface AladinApiError {
  errorCode: number;
  errorMessage: string;
}

/**
 * 에러 코드 열거형
 */
export enum ErrorCode {
  INVALID_TTB_KEY = 100,
  MISSING_REQUIRED_PARAM = 200,
  INVALID_PARAM_VALUE = 300,
  SYSTEM_ERROR = 900,
  DAILY_LIMIT_EXCEEDED = 901
}

/**
 * 표준화된 에러 응답
 */
export interface StandardError {
  code: ErrorCode;
  message: string;
  originalError?: AladinApiError;
  timestamp: string;
}

// ===== MCP 도구 관련 타입 =====

/**
 * MCP 도구 입력 스키마
 */
export interface McpToolSchema {
  type: 'object';
  properties: Record<string, any>;
  required?: string[];
}

/**
 * MCP 도구 정의
 */
export interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: McpToolSchema;
}

/**
 * aladin_search 도구 입력
 */
export interface AladinSearchInput {
  query: string;
  queryType?: QueryType;
  searchTarget?: SearchTarget;
  sort?: SortOption;
  cover?: CoverSize;
  categoryId?: number;
  start?: number;
  maxResults?: number;
  optResult?: OptResult[];
}

/**
 * aladin_book_info 도구 입력
 */
export interface AladinBookInfoInput {
  itemId?: string;
  isbn?: string;
  isbn13?: string;
  cover?: CoverSize;
  optResult?: OptResult[];
}

/**
 * aladin_bestsellers 도구 입력
 */
export interface AladinBestsellersInput {
  categoryId?: number;
  searchTarget?: SearchTarget;
  year?: number;
  month?: number;
  week?: number;
  start?: number;
  maxResults?: number;
  cover?: CoverSize;
}

/**
 * aladin_new_books 도구 입력
 */
export interface AladinNewBooksInput {
  queryType?: 'NewBook' | 'NewSpecial';
  categoryId?: number;
  searchTarget?: SearchTarget;
  start?: number;
  maxResults?: number;
  cover?: CoverSize;
}

/**
 * aladin_item_list 도구 입력
 */
export interface AladinItemListInput {
  queryType: ListQueryType;
  categoryId?: number;
  searchTarget?: SearchTarget;
  start?: number;
  maxResults?: number;
  cover?: CoverSize;
}

/**
 * aladin_categories 도구 입력
 */
export interface AladinCategoriesInput {
  categoryName?: string;
  categoryId?: number;
  depth?: number;
}

/**
 * MCP 도구 응답 표준 포맷
 */
export interface McpToolResponse<T = any> {
  success: boolean;
  data?: T;
  error?: StandardError;
  metadata?: {
    totalResults?: number;
    startIndex?: number;
    itemsPerPage?: number;
    query?: string;
    timestamp: string;
  };
}

// ===== 카테고리 관련 타입 =====

/**
 * 카테고리 CSV 데이터 구조
 */
export interface CategoryCsvRow {
  CID: number;
  '1Depth': string;
  '2Depth': string;
  '3Depth': string;
  '4Depth': string;
  '5Depth': string;
  '몰구분': string;
}

/**
 * 파싱된 카테고리 정보
 */
export interface ParsedCategory {
  id: number;
  name: string;
  depth: number;
  parentId?: number;
  parentName?: string;
  fullPath: string[];
  mallType: string;
}

/**
 * 카테고리 검색 결과
 */
export interface CategorySearchResult {
  categories: ParsedCategory[];
  totalCount: number;
}

// ===== 서버 설정 및 상태 타입 =====

/**
 * 서버 메타데이터
 */
export interface ServerMetadata {
  name: string;
  version: string;
  description: string;
  apiVersion: ApiVersion;
  supportedTools: string[];
}

/**
 * API 사용량 추적
 */
export interface ApiUsageStats {
  dailyCount: number;
  dailyLimit: number;
  lastReset: Date;
  lastCall: Date;
}

/**
 * 서버 상태
 */
export interface ServerStatus {
  isHealthy: boolean;
  uptime: number;
  apiUsage: ApiUsageStats;
  lastError?: StandardError;
}

// ===== 유틸리티 타입 =====

/**
 * 부분 업데이트용 타입
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * 필수 필드만 포함하는 타입
 */
export type RequiredOnly<T, K extends keyof T> = Pick<T, K> & Partial<Omit<T, K>>;

/**
 * 검증 결과 타입
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * 캐시 엔트리 타입
 */
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}