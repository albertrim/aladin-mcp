/**
 * 알라딘 OpenAPI MCP 서버용 포맷터 유틸리티
 *
 * MCP 응답, 도서 정보, 에러 메시지, 날짜/가격 등을 표준화된 형식으로 포맷팅하는 함수들을 제공합니다.
 */

import type {
  CompleteBookItem,
  BookItem,
  SearchResponse,
  LookupResponse,
  ListResponse,
  McpToolResponse,
  StandardError,
  ErrorCode,
  AladinApiError,
  CategoryInfo,
  Author,
  BestSellerRank
} from '../types.js';

import { ERROR_MESSAGES, CLIENT_ERROR_MESSAGES } from '../constants/api.js';

// ===== MCP 응답 포맷터 =====

/**
 * 성공적인 MCP 도구 응답을 포맷팅합니다
 * @param data 응답 데이터
 * @param metadata 메타데이터
 * @returns 포맷팅된 MCP 응답
 */
export function formatMcpSuccessResponse<T>(
  data: T,
  metadata?: {
    totalResults?: number;
    startIndex?: number;
    itemsPerPage?: number;
    query?: string;
  }
): McpToolResponse<T> {
  return {
    success: true,
    data,
    metadata: {
      ...metadata,
      timestamp: new Date().toISOString()
    }
  };
}

/**
 * 에러가 발생한 MCP 도구 응답을 포맷팅합니다
 * @param error 에러 정보
 * @returns 포맷팅된 MCP 에러 응답
 */
export function formatMcpErrorResponse(error: StandardError): McpToolResponse {
  return {
    success: false,
    error,
    metadata: {
      timestamp: new Date().toISOString()
    }
  };
}

/**
 * 알라딘 검색 응답을 MCP 형식으로 포맷팅합니다
 * @param response 알라딘 검색 응답
 * @returns 포맷팅된 MCP 응답
 */
export function formatSearchResponseToMcp(response: SearchResponse): McpToolResponse<CompleteBookItem[]> {
  const formattedBooks = response.item.map(formatBookItem);

  return formatMcpSuccessResponse(formattedBooks, {
    totalResults: response.totalResults,
    startIndex: response.startIndex,
    itemsPerPage: response.itemsPerPage,
    query: response.query
  });
}

/**
 * 알라딘 상세 조회 응답을 MCP 형식으로 포맷팅합니다
 * @param response 알라딘 상세 조회 응답
 * @returns 포맷팅된 MCP 응답
 */
export function formatLookupResponseToMcp(response: LookupResponse): McpToolResponse<CompleteBookItem> {
  if (!response.item || response.item.length === 0) {
    const error: StandardError = {
      code: 300 as ErrorCode,
      message: '해당 조건에 맞는 도서를 찾을 수 없습니다.',
      timestamp: new Date().toISOString()
    };
    return formatMcpErrorResponse(error);
  }

  const formattedBook = formatBookItem(response.item[0]);
  return formatMcpSuccessResponse(formattedBook);
}

/**
 * 알라딘 리스트 응답을 MCP 형식으로 포맷팅합니다
 * @param response 알라딘 리스트 응답
 * @returns 포맷팅된 MCP 응답
 */
export function formatListResponseToMcp(response: ListResponse): McpToolResponse<CompleteBookItem[]> {
  const formattedBooks = response.item.map(formatBookItem);

  return formatMcpSuccessResponse(formattedBooks, {
    totalResults: response.item.length,
    startIndex: 1,
    itemsPerPage: response.item.length
  });
}

// ===== 도서 정보 포맷터 =====

/**
 * 도서 정보를 사용자 친화적인 형식으로 포맷팅합니다
 * @param book 원본 도서 정보
 * @returns 포맷팅된 도서 정보
 */
export function formatBookItem(book: CompleteBookItem): CompleteBookItem {
  return {
    ...book,
    title: cleanTitle(book.title),
    author: formatAuthorNames(book.author),
    description: cleanDescription(book.description),
    pubDate: formatPublishDate(book.pubDate),
    priceSales: book.priceSales || 0,
    priceStandard: book.priceStandard || 0,
    subInfo: book.subInfo ? formatSubInfo(book.subInfo) : undefined
  };
}

/**
 * 도서 제목을 정리합니다 (HTML 태그 제거, 특수문자 정리)
 * @param title 원본 제목
 * @returns 정리된 제목
 */
export function cleanTitle(title: string): string {
  if (!title) return '';

  return title
    .replace(/<[^>]*>/g, '') // HTML 태그 제거
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ') // 연속된 공백을 하나로
    .trim();
}

/**
 * 저자명을 정리하고 포맷팅합니다
 * @param authorString 원본 저자 문자열
 * @returns 포맷팅된 저자명
 */
export function formatAuthorNames(authorString: string): string {
  if (!authorString) return '';

  return authorString
    .replace(/\(지은이\)/g, '')
    .replace(/\(옮긴이\)/g, ' (역)')
    .replace(/\(편집\)/g, ' (편)')
    .replace(/\(그림\)/g, ' (그림)')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * 도서 설명을 정리합니다
 * @param description 원본 설명
 * @returns 정리된 설명
 */
export function cleanDescription(description: string): string {
  if (!description) return '';

  return description
    .replace(/<[^>]*>/g, '') // HTML 태그 제거
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * 출간일을 한국어 형식으로 포맷팅합니다
 * @param pubDate 원본 출간일 (YYYY-MM-DD 형식)
 * @returns 포맷팅된 출간일
 */
export function formatPublishDate(pubDate: string): string {
  if (!pubDate) return '';

  try {
    const date = new Date(pubDate);
    if (isNaN(date.getTime())) return pubDate; // 유효하지 않은 날짜면 원본 반환

    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();

    return `${year}년 ${month}월 ${day}일`;
  } catch (error) {
    return pubDate; // 에러 발생 시 원본 반환
  }
}

/**
 * SubInfo를 정리하고 포맷팅합니다
 * @param subInfo 원본 SubInfo
 * @returns 포맷팅된 SubInfo
 */
export function formatSubInfo(subInfo: any): any {
  const formatted: any = {};

  if (subInfo.authors && Array.isArray(subInfo.authors)) {
    formatted.authors = subInfo.authors.map(formatAuthorInfo);
  }

  if (subInfo.fulldescription) {
    formatted.fulldescription = cleanDescription(subInfo.fulldescription);
  }

  if (subInfo.toc) {
    formatted.toc = cleanDescription(subInfo.toc);
  }

  if (subInfo.story) {
    formatted.story = cleanDescription(subInfo.story);
  }

  if (subInfo.categoryIdList && Array.isArray(subInfo.categoryIdList)) {
    formatted.categoryIdList = subInfo.categoryIdList.map(formatCategoryInfo);
  }

  if (subInfo.ratingInfo) {
    formatted.ratingInfo = subInfo.ratingInfo;
  }

  if (subInfo.bestSellerRank && Array.isArray(subInfo.bestSellerRank)) {
    formatted.bestSellerRank = subInfo.bestSellerRank.map(formatBestSellerRank);
  }

  if (subInfo.cardPromotionList) {
    formatted.cardPromotionList = subInfo.cardPromotionList;
  }

  if (subInfo.packList) {
    formatted.packList = subInfo.packList;
  }

  return formatted;
}

/**
 * 저자 정보를 포맷팅합니다
 * @param author 원본 저자 정보
 * @returns 포맷팅된 저자 정보
 */
export function formatAuthorInfo(author: Author): Author {
  return {
    ...author,
    authorName: cleanTitle(author.authorName),
    authorType: formatAuthorType(author.authorType),
    authorInfo: cleanDescription(author.authorInfo)
  };
}

/**
 * 저자 타입을 한국어로 포맷팅합니다
 * @param authorType 원본 저자 타입
 * @returns 포맷팅된 저자 타입
 */
export function formatAuthorType(authorType: string): string {
  const typeMap: Record<string, string> = {
    'author': '저자',
    'translator': '역자',
    'editor': '편집자',
    'illustrator': '삽화가',
    'photographer': '사진가'
  };

  return typeMap[authorType] || authorType;
}

/**
 * 카테고리 정보를 포맷팅합니다
 * @param category 원본 카테고리 정보
 * @returns 포맷팅된 카테고리 정보
 */
export function formatCategoryInfo(category: CategoryInfo): CategoryInfo {
  return {
    ...category,
    categoryName: cleanTitle(category.categoryName)
  };
}

/**
 * 베스트셀러 순위 정보를 포맷팅합니다
 * @param rank 원본 베스트셀러 순위 정보
 * @returns 포맷팅된 베스트셀러 순위 정보
 */
export function formatBestSellerRank(rank: BestSellerRank): BestSellerRank {
  return {
    ...rank,
    categoryName: cleanTitle(rank.categoryName),
    period: formatPeriod(rank.period)
  };
}

/**
 * 기간 정보를 한국어로 포맷팅합니다
 * @param period 원본 기간 정보
 * @returns 포맷팅된 기간 정보
 */
export function formatPeriod(period: string): string {
  const periodMap: Record<string, string> = {
    'Daily': '일간',
    'Weekly': '주간',
    'Monthly': '월간',
    'Yearly': '연간'
  };

  return periodMap[period] || period;
}

// ===== 가격 포맷터 =====

/**
 * 가격을 한국어 통화 형식으로 포맷팅합니다
 * @param price 가격 (숫자)
 * @returns 포맷팅된 가격 문자열
 */
export function formatPrice(price: number): string {
  if (typeof price !== 'number' || isNaN(price)) {
    return '가격 정보 없음';
  }

  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW'
  }).format(price);
}

/**
 * 할인율을 계산하고 포맷팅합니다
 * @param standardPrice 정가
 * @param salesPrice 판매가
 * @returns 할인율 문자열
 */
export function formatDiscountRate(standardPrice: number, salesPrice: number): string {
  if (typeof standardPrice !== 'number' || typeof salesPrice !== 'number' ||
      standardPrice <= 0 || salesPrice <= 0 || salesPrice >= standardPrice) {
    return '할인 없음';
  }

  const discountRate = Math.round(((standardPrice - salesPrice) / standardPrice) * 100);
  return `${discountRate}% 할인`;
}

/**
 * 도서의 가격 정보를 종합적으로 포맷팅합니다
 * @param book 도서 정보
 * @returns 포맷팅된 가격 정보 문자열
 */
export function formatBookPriceInfo(book: BookItem): string {
  const standardPrice = book.priceStandard || 0;
  const salesPrice = book.priceSales || 0;

  if (standardPrice <= 0 && salesPrice <= 0) {
    return '가격 정보 없음';
  }

  if (standardPrice > 0 && salesPrice > 0 && salesPrice < standardPrice) {
    const discount = formatDiscountRate(standardPrice, salesPrice);
    return `${formatPrice(salesPrice)} (정가 ${formatPrice(standardPrice)}, ${discount})`;
  }

  if (salesPrice > 0) {
    return formatPrice(salesPrice);
  }

  return formatPrice(standardPrice);
}

// ===== 날짜 포맷터 =====

/**
 * ISO 날짜를 한국어 형식으로 포맷팅합니다
 * @param isoDate ISO 형식 날짜 문자열
 * @returns 한국어 날짜 문자열
 */
export function formatDateToKorean(isoDate: string): string {
  if (!isoDate) return '';

  try {
    const date = new Date(isoDate);
    if (isNaN(date.getTime())) return isoDate;

    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short'
    });
  } catch (error) {
    return isoDate;
  }
}

/**
 * 날짜를 상대적 시간으로 포맷팅합니다 (예: "3일 전", "1시간 후")
 * @param date 날짜 문자열 또는 Date 객체
 * @returns 상대적 시간 문자열
 */
export function formatRelativeTime(date: string | Date): string {
  try {
    const targetDate = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - targetDate.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays}일 전`;
    } else if (diffHours > 0) {
      return `${diffHours}시간 전`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes}분 전`;
    } else if (diffSeconds > 0) {
      return `${diffSeconds}초 전`;
    } else {
      return '방금 전';
    }
  } catch (error) {
    return '알 수 없음';
  }
}

// ===== 에러 메시지 포맷터 =====

/**
 * 알라딘 API 에러를 표준 에러 형식으로 포맷팅합니다
 * @param apiError 알라딘 API 에러
 * @returns 표준화된 에러 객체
 */
export function formatAladinApiError(apiError: AladinApiError): StandardError {
  const errorCode = apiError.errorCode as ErrorCode;
  const standardMessage = ERROR_MESSAGES[errorCode] || '알 수 없는 에러가 발생했습니다.';

  return {
    code: errorCode,
    message: standardMessage,
    originalError: apiError,
    timestamp: new Date().toISOString()
  };
}

/**
 * 클라이언트 에러를 표준 에러 형식으로 포맷팅합니다
 * @param errorType 에러 타입
 * @param details 에러 상세 정보
 * @returns 표준화된 에러 객체
 */
export function formatClientError(
  errorType: keyof typeof CLIENT_ERROR_MESSAGES,
  details?: string
): StandardError {
  const message = CLIENT_ERROR_MESSAGES[errorType];
  const fullMessage = details ? `${message} ${details}` : message;

  return {
    code: 300 as ErrorCode, // 클라이언트 에러는 300번대로 통일
    message: fullMessage,
    timestamp: new Date().toISOString()
  };
}

/**
 * 검증 에러를 표준 에러 형식으로 포맷팅합니다
 * @param validationErrors 검증 에러 배열
 * @returns 표준화된 에러 객체
 */
export function formatValidationError(validationErrors: string[]): StandardError {
  const message = validationErrors.length === 1
    ? validationErrors[0]
    : `입력값 검증 실패: ${validationErrors.join(', ')}`;

  return {
    code: 300 as ErrorCode,
    message,
    timestamp: new Date().toISOString()
  };
}

// ===== 문자열 유틸리티 =====

/**
 * 문자열을 지정된 길이로 자르고 말줄임표를 추가합니다
 * @param text 원본 텍스트
 * @param maxLength 최대 길이
 * @returns 자른 텍스트
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text || typeof text !== 'string') return '';
  if (text.length <= maxLength) return text;

  return text.substring(0, maxLength - 3) + '...';
}

/**
 * HTML을 일반 텍스트로 변환합니다
 * @param html HTML 문자열
 * @returns 일반 텍스트
 */
export function htmlToText(html: string): string {
  if (!html || typeof html !== 'string') return '';

  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<p[^>]*>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * 검색어를 하이라이트합니다
 * @param text 원본 텍스트
 * @param query 검색어
 * @returns 하이라이트된 텍스트
 */
export function highlightSearchTerm(text: string, query: string): string {
  if (!text || !query) return text;

  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escapedQuery})`, 'gi');

  return text.replace(regex, '**$1**');
}

// ===== 통계 정보 포맷터 =====

/**
 * API 사용량 통계를 포맷팅합니다
 * @param dailyCount 일일 사용량
 * @param dailyLimit 일일 제한
 * @returns 포맷팅된 사용량 정보
 */
export function formatApiUsageStats(dailyCount: number, dailyLimit: number): string {
  const percentage = Math.round((dailyCount / dailyLimit) * 100);
  const remaining = dailyLimit - dailyCount;

  return `API 사용량: ${dailyCount.toLocaleString('ko-KR')}/${dailyLimit.toLocaleString('ko-KR')} (${percentage}% 사용, ${remaining.toLocaleString('ko-KR')}회 남음)`;
}

/**
 * 검색 결과 요약을 포맷팅합니다
 * @param totalResults 전체 결과 수
 * @param itemsPerPage 페이지당 항목 수
 * @param startIndex 시작 인덱스
 * @returns 포맷팅된 요약 정보
 */
export function formatSearchSummary(
  totalResults: number,
  itemsPerPage: number,
  startIndex: number
): string {
  const endIndex = Math.min(startIndex + itemsPerPage - 1, totalResults);

  if (totalResults === 0) {
    return '검색 결과가 없습니다.';
  }

  return `전체 ${totalResults.toLocaleString('ko-KR')}건 중 ${startIndex.toLocaleString('ko-KR')}-${endIndex.toLocaleString('ko-KR')}번째 결과`;
}