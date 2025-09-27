/**
 * 알라딘 OpenAPI MCP 서버용 검증 유틸리티
 *
 * ISBN, 카테고리 ID, 검색 파라미터 등의 유효성을 검증하는 함수들을 제공합니다.
 */

import type {
  SearchTarget,
  QueryType,
  SortOption,
  CoverSize,
  OptResult,
  ListQueryType,
  ValidationResult,
  AladinSearchInput,
  AladinBookInfoInput,
  AladinBestsellersInput,
  AladinNewBooksInput,
  AladinItemListInput,
  AladinCategoriesInput
} from '../types.js';

import {
  VALIDATION_RULES,
  SEARCH_TARGETS,
  QUERY_TYPES,
  SORT_OPTIONS,
  COVER_SIZES,
  OPT_RESULTS,
  LIST_QUERY_TYPES,
  CLIENT_ERROR_MESSAGES
} from '../constants/api.js';

// ===== 기본 타입 검증 함수 =====

/**
 * ISBN-10 형식을 검증합니다
 * @param isbn ISBN-10 문자열
 * @returns 검증 결과
 */
export function validateIsbn10(isbn: string): ValidationResult {
  const errors: string[] = [];

  if (!isbn || typeof isbn !== 'string') {
    errors.push('ISBN-10은 문자열이어야 합니다.');
    return { isValid: false, errors };
  }

  if (!VALIDATION_RULES.ISBN_10_PATTERN.test(isbn)) {
    errors.push('ISBN-10은 10자리 숫자여야 하며, 마지막 자리는 숫자 또는 X여야 합니다.');
    return { isValid: false, errors };
  }

  // ISBN-10 체크섬 검증
  const digits = isbn.slice(0, 9).split('').map(Number);
  const checkDigit = isbn[9];

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += digits[i] * (10 - i);
  }

  const remainder = sum % 11;
  const expectedCheckDigit = remainder === 0 ? '0' :
                            remainder === 1 ? 'X' :
                            String(11 - remainder);

  if (checkDigit !== expectedCheckDigit) {
    errors.push('유효하지 않은 ISBN-10 체크섬입니다.');
    return { isValid: false, errors };
  }

  return { isValid: true, errors: [] };
}

/**
 * ISBN-13 형식을 검증합니다
 * @param isbn ISBN-13 문자열
 * @returns 검증 결과
 */
export function validateIsbn13(isbn: string): ValidationResult {
  const errors: string[] = [];

  if (!isbn || typeof isbn !== 'string') {
    errors.push('ISBN-13은 문자열이어야 합니다.');
    return { isValid: false, errors };
  }

  if (!VALIDATION_RULES.ISBN_13_PATTERN.test(isbn)) {
    errors.push('ISBN-13은 13자리 숫자여야 합니다.');
    return { isValid: false, errors };
  }

  // ISBN-13 체크섬 검증
  const digits = isbn.split('').map(Number);
  let sum = 0;

  for (let i = 0; i < 12; i++) {
    sum += digits[i] * (i % 2 === 0 ? 1 : 3);
  }

  const checkDigit = (10 - (sum % 10)) % 10;

  if (digits[12] !== checkDigit) {
    errors.push('유효하지 않은 ISBN-13 체크섬입니다.');
    return { isValid: false, errors };
  }

  return { isValid: true, errors: [] };
}

/**
 * ISBN 형식을 자동 감지하여 검증합니다
 * @param isbn ISBN 문자열
 * @returns 검증 결과
 */
export function validateIsbn(isbn: string): ValidationResult {
  if (!isbn || typeof isbn !== 'string') {
    return { isValid: false, errors: ['ISBN은 문자열이어야 합니다.'] };
  }

  // 하이픈 제거
  const cleanIsbn = isbn.replace(/-/g, '');

  if (cleanIsbn.length === 10) {
    return validateIsbn10(cleanIsbn);
  } else if (cleanIsbn.length === 13) {
    return validateIsbn13(cleanIsbn);
  } else {
    return {
      isValid: false,
      errors: ['ISBN은 10자리 또는 13자리여야 합니다.']
    };
  }
}

/**
 * 알라딘 상품 ID 형식을 검증합니다
 * @param itemId 상품 ID
 * @returns 검증 결과
 */
export function validateItemId(itemId: string): ValidationResult {
  const errors: string[] = [];

  if (!itemId || typeof itemId !== 'string') {
    errors.push('상품 ID는 문자열이어야 합니다.');
    return { isValid: false, errors };
  }

  if (!/^\d+$/.test(itemId)) {
    errors.push('상품 ID는 숫자로만 구성되어야 합니다.');
    return { isValid: false, errors };
  }

  if (itemId.length < 1 || itemId.length > 20) {
    errors.push('상품 ID는 1-20자리여야 합니다.');
    return { isValid: false, errors };
  }

  return { isValid: true, errors: [] };
}

/**
 * 카테고리 ID를 검증합니다
 * @param categoryId 카테고리 ID
 * @returns 검증 결과
 */
export function validateCategoryId(categoryId: number): ValidationResult {
  const errors: string[] = [];

  if (typeof categoryId !== 'number' || isNaN(categoryId)) {
    errors.push('카테고리 ID는 숫자여야 합니다.');
    return { isValid: false, errors };
  }

  if (!Number.isInteger(categoryId)) {
    errors.push('카테고리 ID는 정수여야 합니다.');
    return { isValid: false, errors };
  }

  if (categoryId < VALIDATION_RULES.MIN_CATEGORY_ID ||
      categoryId > VALIDATION_RULES.MAX_CATEGORY_ID) {
    errors.push(`카테고리 ID는 ${VALIDATION_RULES.MIN_CATEGORY_ID}-${VALIDATION_RULES.MAX_CATEGORY_ID} 범위여야 합니다.`);
    return { isValid: false, errors };
  }

  return { isValid: true, errors: [] };
}

/**
 * 검색 대상을 검증합니다
 * @param searchTarget 검색 대상
 * @returns 검증 결과
 */
export function validateSearchTarget(searchTarget: string): ValidationResult {
  const errors: string[] = [];

  if (!searchTarget || typeof searchTarget !== 'string') {
    errors.push('검색 대상은 문자열이어야 합니다.');
    return { isValid: false, errors };
  }

  if (!(searchTarget in SEARCH_TARGETS)) {
    errors.push(`지원되지 않는 검색 대상입니다. 지원 대상: ${Object.keys(SEARCH_TARGETS).join(', ')}`);
    return { isValid: false, errors };
  }

  return { isValid: true, errors: [] };
}

/**
 * 쿼리 타입을 검증합니다
 * @param queryType 쿼리 타입
 * @returns 검증 결과
 */
export function validateQueryType(queryType: string): ValidationResult {
  const errors: string[] = [];

  if (!queryType || typeof queryType !== 'string') {
    errors.push('쿼리 타입은 문자열이어야 합니다.');
    return { isValid: false, errors };
  }

  if (!(queryType in QUERY_TYPES)) {
    errors.push(`지원되지 않는 쿼리 타입입니다. 지원 타입: ${Object.keys(QUERY_TYPES).join(', ')}`);
    return { isValid: false, errors };
  }

  return { isValid: true, errors: [] };
}

/**
 * 정렬 옵션을 검증합니다
 * @param sortOption 정렬 옵션
 * @returns 검증 결과
 */
export function validateSortOption(sortOption: string): ValidationResult {
  const errors: string[] = [];

  if (!sortOption || typeof sortOption !== 'string') {
    errors.push('정렬 옵션은 문자열이어야 합니다.');
    return { isValid: false, errors };
  }

  if (!(sortOption in SORT_OPTIONS)) {
    errors.push(`지원되지 않는 정렬 옵션입니다. 지원 옵션: ${Object.keys(SORT_OPTIONS).join(', ')}`);
    return { isValid: false, errors };
  }

  return { isValid: true, errors: [] };
}

/**
 * 표지 크기를 검증합니다
 * @param coverSize 표지 크기
 * @returns 검증 결과
 */
export function validateCoverSize(coverSize: string): ValidationResult {
  const errors: string[] = [];

  if (!coverSize || typeof coverSize !== 'string') {
    errors.push('표지 크기는 문자열이어야 합니다.');
    return { isValid: false, errors };
  }

  if (!(coverSize in COVER_SIZES)) {
    errors.push(`지원되지 않는 표지 크기입니다. 지원 크기: ${Object.keys(COVER_SIZES).join(', ')}`);
    return { isValid: false, errors };
  }

  return { isValid: true, errors: [] };
}

/**
 * 부가 정보 옵션을 검증합니다
 * @param optResults 부가 정보 옵션 배열
 * @returns 검증 결과
 */
export function validateOptResults(optResults: string[]): ValidationResult {
  const errors: string[] = [];

  if (!Array.isArray(optResults)) {
    errors.push('부가 정보 옵션은 배열이어야 합니다.');
    return { isValid: false, errors };
  }

  for (const optResult of optResults) {
    if (typeof optResult !== 'string') {
      errors.push('부가 정보 옵션의 각 항목은 문자열이어야 합니다.');
      continue;
    }

    if (!(optResult in OPT_RESULTS)) {
      errors.push(`지원되지 않는 부가 정보 옵션입니다: ${optResult}. 지원 옵션: ${Object.keys(OPT_RESULTS).join(', ')}`);
    }
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * 리스트 쿼리 타입을 검증합니다
 * @param listQueryType 리스트 쿼리 타입
 * @returns 검증 결과
 */
export function validateListQueryType(listQueryType: string): ValidationResult {
  const errors: string[] = [];

  if (!listQueryType || typeof listQueryType !== 'string') {
    errors.push('리스트 쿼리 타입은 문자열이어야 합니다.');
    return { isValid: false, errors };
  }

  if (!(listQueryType in LIST_QUERY_TYPES)) {
    errors.push(`지원되지 않는 리스트 쿼리 타입입니다. 지원 타입: ${Object.keys(LIST_QUERY_TYPES).join(', ')}`);
    return { isValid: false, errors };
  }

  return { isValid: true, errors: [] };
}

/**
 * TTB 키 형식을 검증합니다
 * @param ttbKey TTB 키
 * @returns 검증 결과
 */
export function validateTtbKey(ttbKey: string): ValidationResult {
  const errors: string[] = [];

  if (!ttbKey || typeof ttbKey !== 'string') {
    errors.push('TTB 키는 문자열이어야 합니다.');
    return { isValid: false, errors };
  }

  if (!VALIDATION_RULES.TTB_KEY_PATTERN.test(ttbKey)) {
    errors.push('유효하지 않은 TTB 키 형식입니다. "ttb"로 시작해야 합니다.');
    return { isValid: false, errors };
  }

  return { isValid: true, errors: [] };
}

// ===== 날짜 형식 검증 함수 =====

/**
 * 년도를 검증합니다
 * @param year 년도
 * @returns 검증 결과
 */
export function validateYear(year: number): ValidationResult {
  const errors: string[] = [];

  if (typeof year !== 'number' || isNaN(year)) {
    errors.push('년도는 숫자여야 합니다.');
    return { isValid: false, errors };
  }

  if (!Number.isInteger(year)) {
    errors.push('년도는 정수여야 합니다.');
    return { isValid: false, errors };
  }

  if (year < VALIDATION_RULES.MIN_YEAR || year > VALIDATION_RULES.MAX_YEAR) {
    errors.push(`년도는 ${VALIDATION_RULES.MIN_YEAR}-${VALIDATION_RULES.MAX_YEAR} 범위여야 합니다.`);
    return { isValid: false, errors };
  }

  return { isValid: true, errors: [] };
}

/**
 * 월을 검증합니다
 * @param month 월
 * @returns 검증 결과
 */
export function validateMonth(month: number): ValidationResult {
  const errors: string[] = [];

  if (typeof month !== 'number' || isNaN(month)) {
    errors.push('월은 숫자여야 합니다.');
    return { isValid: false, errors };
  }

  if (!Number.isInteger(month)) {
    errors.push('월은 정수여야 합니다.');
    return { isValid: false, errors };
  }

  if (month < VALIDATION_RULES.MIN_MONTH || month > VALIDATION_RULES.MAX_MONTH) {
    errors.push(`월은 ${VALIDATION_RULES.MIN_MONTH}-${VALIDATION_RULES.MAX_MONTH} 범위여야 합니다.`);
    return { isValid: false, errors };
  }

  return { isValid: true, errors: [] };
}

/**
 * 주를 검증합니다
 * @param week 주
 * @returns 검증 결과
 */
export function validateWeek(week: number): ValidationResult {
  const errors: string[] = [];

  if (typeof week !== 'number' || isNaN(week)) {
    errors.push('주는 숫자여야 합니다.');
    return { isValid: false, errors };
  }

  if (!Number.isInteger(week)) {
    errors.push('주는 정수여야 합니다.');
    return { isValid: false, errors };
  }

  if (week < VALIDATION_RULES.MIN_WEEK || week > VALIDATION_RULES.MAX_WEEK) {
    errors.push(`주는 ${VALIDATION_RULES.MIN_WEEK}-${VALIDATION_RULES.MAX_WEEK} 범위여야 합니다.`);
    return { isValid: false, errors };
  }

  return { isValid: true, errors: [] };
}

// ===== 페이지네이션 검증 함수 =====

/**
 * 시작 위치를 검증합니다
 * @param start 시작 위치
 * @returns 검증 결과
 */
export function validateStart(start: number): ValidationResult {
  const errors: string[] = [];

  if (typeof start !== 'number' || isNaN(start)) {
    errors.push('시작 위치는 숫자여야 합니다.');
    return { isValid: false, errors };
  }

  if (!Number.isInteger(start)) {
    errors.push('시작 위치는 정수여야 합니다.');
    return { isValid: false, errors };
  }

  if (start < VALIDATION_RULES.MIN_START || start > VALIDATION_RULES.MAX_START) {
    errors.push(`시작 위치는 ${VALIDATION_RULES.MIN_START}-${VALIDATION_RULES.MAX_START} 범위여야 합니다.`);
    return { isValid: false, errors };
  }

  return { isValid: true, errors: [] };
}

/**
 * 최대 결과 수를 검증합니다
 * @param maxResults 최대 결과 수
 * @returns 검증 결과
 */
export function validateMaxResults(maxResults: number): ValidationResult {
  const errors: string[] = [];

  if (typeof maxResults !== 'number' || isNaN(maxResults)) {
    errors.push('최대 결과 수는 숫자여야 합니다.');
    return { isValid: false, errors };
  }

  if (!Number.isInteger(maxResults)) {
    errors.push('최대 결과 수는 정수여야 합니다.');
    return { isValid: false, errors };
  }

  if (maxResults < VALIDATION_RULES.MIN_MAX_RESULTS ||
      maxResults > VALIDATION_RULES.MAX_MAX_RESULTS) {
    errors.push(`최대 결과 수는 ${VALIDATION_RULES.MIN_MAX_RESULTS}-${VALIDATION_RULES.MAX_MAX_RESULTS} 범위여야 합니다.`);
    return { isValid: false, errors };
  }

  return { isValid: true, errors: [] };
}

/**
 * 검색 쿼리를 검증합니다
 * @param query 검색 쿼리
 * @returns 검증 결과
 */
export function validateQuery(query: string): ValidationResult {
  const errors: string[] = [];

  if (!query || typeof query !== 'string') {
    errors.push('검색 쿼리는 비어있지 않은 문자열이어야 합니다.');
    return { isValid: false, errors };
  }

  if (query.trim().length < VALIDATION_RULES.MIN_QUERY_LENGTH) {
    errors.push(`검색 쿼리는 최소 ${VALIDATION_RULES.MIN_QUERY_LENGTH}자 이상이어야 합니다.`);
    return { isValid: false, errors };
  }

  if (query.length > VALIDATION_RULES.MAX_QUERY_LENGTH) {
    errors.push(`검색 쿼리는 최대 ${VALIDATION_RULES.MAX_QUERY_LENGTH}자 이하여야 합니다.`);
    return { isValid: false, errors };
  }

  return { isValid: true, errors: [] };
}

// ===== MCP 도구 입력 검증 함수 =====

/**
 * aladin_search 도구 입력을 검증합니다
 * @param input 입력 데이터
 * @returns 검증 결과
 */
export function validateAladinSearchInput(input: AladinSearchInput): ValidationResult {
  const errors: string[] = [];

  // 필수 파라미터 검증
  const queryResult = validateQuery(input.query);
  if (!queryResult.isValid) {
    errors.push(...queryResult.errors);
  }

  // 선택적 파라미터 검증
  if (input.queryType) {
    const queryTypeResult = validateQueryType(input.queryType);
    if (!queryTypeResult.isValid) {
      errors.push(...queryTypeResult.errors);
    }
  }

  if (input.searchTarget) {
    const searchTargetResult = validateSearchTarget(input.searchTarget);
    if (!searchTargetResult.isValid) {
      errors.push(...searchTargetResult.errors);
    }
  }

  if (input.sort) {
    const sortResult = validateSortOption(input.sort);
    if (!sortResult.isValid) {
      errors.push(...sortResult.errors);
    }
  }

  if (input.cover) {
    const coverResult = validateCoverSize(input.cover);
    if (!coverResult.isValid) {
      errors.push(...coverResult.errors);
    }
  }

  if (input.categoryId !== undefined) {
    const categoryResult = validateCategoryId(input.categoryId);
    if (!categoryResult.isValid) {
      errors.push(...categoryResult.errors);
    }
  }

  if (input.start !== undefined) {
    const startResult = validateStart(input.start);
    if (!startResult.isValid) {
      errors.push(...startResult.errors);
    }
  }

  if (input.maxResults !== undefined) {
    const maxResultsResult = validateMaxResults(input.maxResults);
    if (!maxResultsResult.isValid) {
      errors.push(...maxResultsResult.errors);
    }
  }

  if (input.optResult) {
    const optResultsResult = validateOptResults(input.optResult);
    if (!optResultsResult.isValid) {
      errors.push(...optResultsResult.errors);
    }
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * aladin_book_info 도구 입력을 검증합니다
 * @param input 입력 데이터
 * @returns 검증 결과
 */
export function validateAladinBookInfoInput(input: AladinBookInfoInput): ValidationResult {
  const errors: string[] = [];

  // 최소 하나의 식별자가 필요
  if (!input.itemId && !input.isbn && !input.isbn13) {
    errors.push('itemId, isbn, isbn13 중 최소 하나는 제공되어야 합니다.');
    return { isValid: false, errors };
  }

  // 각 식별자 검증
  if (input.itemId) {
    const itemIdResult = validateItemId(input.itemId);
    if (!itemIdResult.isValid) {
      errors.push(...itemIdResult.errors);
    }
  }

  if (input.isbn) {
    const isbnResult = validateIsbn(input.isbn);
    if (!isbnResult.isValid) {
      errors.push(...isbnResult.errors);
    }
  }

  if (input.isbn13) {
    const isbn13Result = validateIsbn13(input.isbn13);
    if (!isbn13Result.isValid) {
      errors.push(...isbn13Result.errors);
    }
  }

  // 선택적 파라미터 검증
  if (input.cover) {
    const coverResult = validateCoverSize(input.cover);
    if (!coverResult.isValid) {
      errors.push(...coverResult.errors);
    }
  }

  if (input.optResult) {
    const optResultsResult = validateOptResults(input.optResult);
    if (!optResultsResult.isValid) {
      errors.push(...optResultsResult.errors);
    }
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * aladin_bestsellers 도구 입력을 검증합니다
 * @param input 입력 데이터
 * @returns 검증 결과
 */
export function validateAladinBestsellersInput(input: AladinBestsellersInput): ValidationResult {
  const errors: string[] = [];

  // 선택적 파라미터 검증
  if (input.categoryId !== undefined) {
    const categoryResult = validateCategoryId(input.categoryId);
    if (!categoryResult.isValid) {
      errors.push(...categoryResult.errors);
    }
  }

  if (input.searchTarget) {
    const searchTargetResult = validateSearchTarget(input.searchTarget);
    if (!searchTargetResult.isValid) {
      errors.push(...searchTargetResult.errors);
    }
  }

  if (input.year !== undefined) {
    const yearResult = validateYear(input.year);
    if (!yearResult.isValid) {
      errors.push(...yearResult.errors);
    }
  }

  if (input.month !== undefined) {
    const monthResult = validateMonth(input.month);
    if (!monthResult.isValid) {
      errors.push(...monthResult.errors);
    }
  }

  if (input.week !== undefined) {
    const weekResult = validateWeek(input.week);
    if (!weekResult.isValid) {
      errors.push(...weekResult.errors);
    }
  }

  if (input.start !== undefined) {
    const startResult = validateStart(input.start);
    if (!startResult.isValid) {
      errors.push(...startResult.errors);
    }
  }

  if (input.maxResults !== undefined) {
    const maxResultsResult = validateMaxResults(input.maxResults);
    if (!maxResultsResult.isValid) {
      errors.push(...maxResultsResult.errors);
    }
  }

  if (input.cover) {
    const coverResult = validateCoverSize(input.cover);
    if (!coverResult.isValid) {
      errors.push(...coverResult.errors);
    }
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * aladin_new_books 도구 입력을 검증합니다
 * @param input 입력 데이터
 * @returns 검증 결과
 */
export function validateAladinNewBooksInput(input: AladinNewBooksInput): ValidationResult {
  const errors: string[] = [];

  // 쿼리 타입 검증 (특별한 경우)
  if (input.queryType && !['NewBook', 'NewSpecial'].includes(input.queryType)) {
    errors.push('queryType은 "NewBook" 또는 "NewSpecial"이어야 합니다.');
  }

  // 선택적 파라미터 검증
  if (input.categoryId !== undefined) {
    const categoryResult = validateCategoryId(input.categoryId);
    if (!categoryResult.isValid) {
      errors.push(...categoryResult.errors);
    }
  }

  if (input.searchTarget) {
    const searchTargetResult = validateSearchTarget(input.searchTarget);
    if (!searchTargetResult.isValid) {
      errors.push(...searchTargetResult.errors);
    }
  }

  if (input.start !== undefined) {
    const startResult = validateStart(input.start);
    if (!startResult.isValid) {
      errors.push(...startResult.errors);
    }
  }

  if (input.maxResults !== undefined) {
    const maxResultsResult = validateMaxResults(input.maxResults);
    if (!maxResultsResult.isValid) {
      errors.push(...maxResultsResult.errors);
    }
  }

  if (input.cover) {
    const coverResult = validateCoverSize(input.cover);
    if (!coverResult.isValid) {
      errors.push(...coverResult.errors);
    }
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * aladin_item_list 도구 입력을 검증합니다
 * @param input 입력 데이터
 * @returns 검증 결과
 */
export function validateAladinItemListInput(input: AladinItemListInput): ValidationResult {
  const errors: string[] = [];

  // 필수 파라미터 검증
  const queryTypeResult = validateListQueryType(input.queryType);
  if (!queryTypeResult.isValid) {
    errors.push(...queryTypeResult.errors);
  }

  // 선택적 파라미터 검증
  if (input.categoryId !== undefined) {
    const categoryResult = validateCategoryId(input.categoryId);
    if (!categoryResult.isValid) {
      errors.push(...categoryResult.errors);
    }
  }

  if (input.searchTarget) {
    const searchTargetResult = validateSearchTarget(input.searchTarget);
    if (!searchTargetResult.isValid) {
      errors.push(...searchTargetResult.errors);
    }
  }

  if (input.start !== undefined) {
    const startResult = validateStart(input.start);
    if (!startResult.isValid) {
      errors.push(...startResult.errors);
    }
  }

  if (input.maxResults !== undefined) {
    const maxResultsResult = validateMaxResults(input.maxResults);
    if (!maxResultsResult.isValid) {
      errors.push(...maxResultsResult.errors);
    }
  }

  if (input.cover) {
    const coverResult = validateCoverSize(input.cover);
    if (!coverResult.isValid) {
      errors.push(...coverResult.errors);
    }
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * aladin_categories 도구 입력을 검증합니다
 * @param input 입력 데이터
 * @returns 검증 결과
 */
export function validateAladinCategoriesInput(input: AladinCategoriesInput): ValidationResult {
  const errors: string[] = [];

  // 최소 하나의 파라미터가 필요
  if (!input.categoryName && input.categoryId === undefined && input.depth === undefined) {
    errors.push('categoryName, categoryId, depth 중 최소 하나는 제공되어야 합니다.');
    return { isValid: false, errors };
  }

  // 카테고리명 검증
  if (input.categoryName && typeof input.categoryName !== 'string') {
    errors.push('카테고리명은 문자열이어야 합니다.');
  }

  // 카테고리 ID 검증
  if (input.categoryId !== undefined) {
    const categoryResult = validateCategoryId(input.categoryId);
    if (!categoryResult.isValid) {
      errors.push(...categoryResult.errors);
    }
  }

  // 깊이 검증
  if (input.depth !== undefined) {
    if (typeof input.depth !== 'number' || isNaN(input.depth)) {
      errors.push('깊이는 숫자여야 합니다.');
    } else if (!Number.isInteger(input.depth)) {
      errors.push('깊이는 정수여야 합니다.');
    } else if (input.depth < 1 || input.depth > 5) {
      errors.push('깊이는 1-5 범위여야 합니다.');
    }
  }

  return { isValid: errors.length === 0, errors };
}