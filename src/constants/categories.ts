/**
 * 알라딘 카테고리 관련 상수 및 유틸리티
 *
 * CSV 파일: aladin_Category_CID_20210927.csv
 * 구조: CID, 카테고리명, 몰, 1Depth, 2Depth, 3Depth, 4Depth, 5Depth
 */

import * as fs from 'fs';
import * as path from 'path';
import csvParser from 'csv-parser';
import type {
  CategoryCsvRow,
  ParsedCategory,
  CategorySearchResult,
  ValidationResult
} from '../types.js';

// ===== 카테고리 파일 설정 =====

/**
 * 카테고리 CSV 파일 경로
 */
export const CATEGORY_CSV_PATH = path.join(process.cwd(), 'aladin_Category_CID_20210927.csv');

/**
 * 카테고리 데이터 캐시
 */
let categoryCache: ParsedCategory[] | null = null;
let categoryMap: Map<number, ParsedCategory> | null = null;
let categoryNameMap: Map<string, ParsedCategory[]> | null = null;

// ===== 카테고리 상수 =====

/**
 * 지원되는 몰 구분
 */
export const MALL_TYPES = {
  DOMESTIC: '국내도서',
  FOREIGN: '외국도서',
  EBOOK: '전자책',
  MUSIC: '음반',
  DVD: 'DVD'
} as const;

/**
 * 카테고리 깊이 제한
 */
export const CATEGORY_DEPTHS = {
  MIN_DEPTH: 1,
  MAX_DEPTH: 5
} as const;

/**
 * 특별 카테고리 ID
 */
export const SPECIAL_CATEGORIES = {
  ALL: 0, // 전체 카테고리
  BOOK: 1, // 도서 (일반적인 기본 카테고리)
  BESTSELLER: 1230 // 베스트셀러에서 자주 사용되는 카테고리
} as const;

// ===== CSV 파싱 유틸리티 =====

/**
 * CSV 파일을 파싱하여 카테고리 데이터를 로드합니다.
 */
export async function loadCategoryData(): Promise<ParsedCategory[]> {
  if (categoryCache) {
    return categoryCache;
  }

  return new Promise((resolve, reject) => {
    const categories: ParsedCategory[] = [];

    // CSV 파일 존재 여부 확인
    if (!fs.existsSync(CATEGORY_CSV_PATH)) {
      reject(new Error(`카테고리 CSV 파일을 찾을 수 없습니다: ${CATEGORY_CSV_PATH}`));
      return;
    }

    fs.createReadStream(CATEGORY_CSV_PATH)
      .pipe(csvParser())
      .on('data', (row: any) => {
        try {
          const parsedCategory = parseCategory(row);
          if (parsedCategory) {
            categories.push(parsedCategory);
          }
        } catch (error: any) {
          console.warn('카테고리 파싱 중 오류:', error, row);
        }
      })
      .on('end', () => {
        categoryCache = categories;
        buildCategoryMaps(categories);
        resolve(categories);
      })
      .on('error', (error: any) => {
        reject(new Error(`CSV 파일 읽기 실패: ${error.message}`));
      });
  });
}

/**
 * CSV 행을 ParsedCategory 객체로 변환합니다.
 */
function parseCategory(row: any): ParsedCategory | null {
  try {
    const cid = parseInt(row.CID?.toString() || '0', 10);
    if (isNaN(cid) || cid <= 0) {
      return null;
    }

    const categoryName = row['카테고리명']?.toString()?.trim();
    const mallType = row['몰']?.toString()?.trim();

    if (!categoryName || !mallType) {
      return null;
    }

    // Depth별 카테고리명 추출
    const depths = [
      row['1Depth']?.toString()?.trim(),
      row['2Depth']?.toString()?.trim(),
      row['3Depth']?.toString()?.trim(),
      row['4Depth']?.toString()?.trim(),
      row['5Depth']?.toString()?.trim()
    ].filter(Boolean);

    // 실제 depth 계산 (비어있지 않은 depth의 개수)
    const actualDepth = depths.length;

    // 부모 카테고리 정보 계산
    const parentName = actualDepth > 1 ? depths[actualDepth - 2] : undefined;

    return {
      id: cid,
      name: categoryName,
      depth: actualDepth,
      parentName,
      fullPath: depths,
      mallType
    };
  } catch (error) {
    console.warn('카테고리 행 파싱 실패:', error, row);
    return null;
  }
}

/**
 * 카테고리 맵을 구축합니다.
 */
function buildCategoryMaps(categories: ParsedCategory[]): void {
  // ID 기반 맵
  categoryMap = new Map();
  categories.forEach(category => {
    categoryMap!.set(category.id, category);
  });

  // 이름 기반 맵 (중복 가능하므로 배열)
  categoryNameMap = new Map();
  categories.forEach(category => {
    const existing = categoryNameMap!.get(category.name) || [];
    existing.push(category);
    categoryNameMap!.set(category.name, existing);
  });
}

// ===== 카테고리 조회 함수 =====

/**
 * 카테고리 ID로 카테고리 정보를 조회합니다.
 */
export async function getCategoryById(categoryId: number): Promise<ParsedCategory | null> {
  if (!categoryMap) {
    await loadCategoryData();
  }

  return categoryMap!.get(categoryId) || null;
}

/**
 * 카테고리명으로 카테고리 정보를 검색합니다.
 */
export async function getCategoriesByName(categoryName: string): Promise<ParsedCategory[]> {
  if (!categoryNameMap) {
    await loadCategoryData();
  }

  return categoryNameMap!.get(categoryName) || [];
}

/**
 * 부분 카테고리명으로 카테고리를 검색합니다.
 */
export async function searchCategories(
  query: string,
  options: {
    mallType?: string;
    depth?: number;
    limit?: number;
  } = {}
): Promise<CategorySearchResult> {
  if (!categoryCache) {
    await loadCategoryData();
  }

  const { mallType, depth, limit = 50 } = options;
  const queryLower = query.toLowerCase();

  let filteredCategories = categoryCache!.filter(category => {
    // 이름 매칭
    const nameMatch = category.name.toLowerCase().includes(queryLower) ||
                     category.fullPath.some(pathItem =>
                       pathItem.toLowerCase().includes(queryLower)
                     );

    if (!nameMatch) return false;

    // 몰 타입 필터
    if (mallType && category.mallType !== mallType) return false;

    // 깊이 필터
    if (depth && category.depth !== depth) return false;

    return true;
  });

  // 관련성 점수로 정렬 (정확한 매치를 우선순위로)
  filteredCategories.sort((a, b) => {
    const aExactMatch = a.name.toLowerCase() === queryLower;
    const bExactMatch = b.name.toLowerCase() === queryLower;

    if (aExactMatch && !bExactMatch) return -1;
    if (!aExactMatch && bExactMatch) return 1;

    // 이름 길이순 (짧은 것이 더 관련성 높음)
    return a.name.length - b.name.length;
  });

  // 제한 적용
  if (limit > 0) {
    filteredCategories = filteredCategories.slice(0, limit);
  }

  return {
    categories: filteredCategories,
    totalCount: filteredCategories.length
  };
}

/**
 * 특정 깊이의 모든 카테고리를 조회합니다.
 */
export async function getCategoriesByDepth(depth: number): Promise<ParsedCategory[]> {
  if (!categoryCache) {
    await loadCategoryData();
  }

  if (depth < CATEGORY_DEPTHS.MIN_DEPTH || depth > CATEGORY_DEPTHS.MAX_DEPTH) {
    throw new Error(`유효하지 않은 깊이입니다. ${CATEGORY_DEPTHS.MIN_DEPTH}-${CATEGORY_DEPTHS.MAX_DEPTH} 사이의 값이어야 합니다.`);
  }

  return categoryCache!.filter(category => category.depth === depth);
}

/**
 * 몰 타입별 카테고리를 조회합니다.
 */
export async function getCategoriesByMallType(mallType: string): Promise<ParsedCategory[]> {
  if (!categoryCache) {
    await loadCategoryData();
  }

  return categoryCache!.filter(category => category.mallType === mallType);
}

/**
 * 부모 카테고리의 하위 카테고리들을 조회합니다.
 */
export async function getSubCategories(parentCategoryName: string): Promise<ParsedCategory[]> {
  if (!categoryCache) {
    await loadCategoryData();
  }

  return categoryCache!.filter(category =>
    category.parentName === parentCategoryName
  );
}

// ===== 카테고리 검증 함수 =====

/**
 * 카테고리 ID의 유효성을 검증합니다.
 */
export async function validateCategoryId(categoryId: number): Promise<ValidationResult> {
  const errors: string[] = [];

  // 기본 범위 검사
  if (categoryId < 0 || categoryId > 99999) {
    errors.push('카테고리 ID는 0-99999 범위여야 합니다.');
  }

  // 특별 카테고리 검사
  if (categoryId === SPECIAL_CATEGORIES.ALL) {
    return { isValid: true, errors: [] };
  }

  // 실제 카테고리 존재 여부 확인
  try {
    const category = await getCategoryById(categoryId);
    if (!category) {
      errors.push(`존재하지 않는 카테고리 ID입니다: ${categoryId}`);
    }
  } catch (error) {
    errors.push(`카테고리 검증 중 오류가 발생했습니다: ${error}`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * 카테고리명의 유효성을 검증합니다.
 */
export async function validateCategoryName(categoryName: string): Promise<ValidationResult> {
  const errors: string[] = [];

  if (!categoryName || categoryName.trim().length === 0) {
    errors.push('카테고리명은 비어있을 수 없습니다.');
    return { isValid: false, errors };
  }

  const trimmedName = categoryName.trim();

  if (trimmedName.length > 100) {
    errors.push('카테고리명은 100자를 초과할 수 없습니다.');
  }

  // 실제 카테고리 존재 여부 확인
  try {
    const categories = await getCategoriesByName(trimmedName);
    if (categories.length === 0) {
      // 부분 검색으로도 확인
      const searchResult = await searchCategories(trimmedName, { limit: 1 });
      if (searchResult.totalCount === 0) {
        errors.push(`존재하지 않는 카테고리명입니다: ${trimmedName}`);
      }
    }
  } catch (error) {
    errors.push(`카테고리 검증 중 오류가 발생했습니다: ${error}`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// ===== 카테고리 유틸리티 함수 =====

/**
 * 카테고리의 전체 경로를 문자열로 반환합니다.
 */
export function getCategoryPath(category: ParsedCategory): string {
  return category.fullPath.join(' > ');
}

/**
 * 카테고리를 표시용 문자열로 포맷합니다.
 */
export function formatCategoryForDisplay(category: ParsedCategory): string {
  const path = getCategoryPath(category);
  return `[${category.id}] ${path} (${category.mallType})`;
}

/**
 * 카테고리 데이터를 JSON 형태로 내보냅니다.
 */
export async function exportCategoriesAsJson(): Promise<string> {
  if (!categoryCache) {
    await loadCategoryData();
  }

  return JSON.stringify(categoryCache, null, 2);
}

/**
 * 카테고리 통계 정보를 반환합니다.
 */
export async function getCategoryStats(): Promise<{
  totalCount: number;
  byMallType: Record<string, number>;
  byDepth: Record<number, number>;
}> {
  if (!categoryCache) {
    await loadCategoryData();
  }

  const byMallType: Record<string, number> = {};
  const byDepth: Record<number, number> = {};

  categoryCache!.forEach(category => {
    // 몰 타입별 통계
    byMallType[category.mallType] = (byMallType[category.mallType] || 0) + 1;

    // 깊이별 통계
    byDepth[category.depth] = (byDepth[category.depth] || 0) + 1;
  });

  return {
    totalCount: categoryCache!.length,
    byMallType,
    byDepth
  };
}

/**
 * 캐시를 초기화합니다.
 */
export function clearCategoryCache(): void {
  categoryCache = null;
  categoryMap = null;
  categoryNameMap = null;
}

/**
 * 카테고리 데이터가 로드되었는지 확인합니다.
 */
export function isCategoryDataLoaded(): boolean {
  return categoryCache !== null;
}

// ===== 자동 초기화 =====

/**
 * 모듈 로드 시 카테고리 데이터를 자동으로 로드합니다.
 * 실패 시 경고만 출력하고 계속 진행합니다.
 */
loadCategoryData().catch(error => {
  console.warn('카테고리 데이터 자동 로드 실패:', error.message);
  console.warn('카테고리 관련 기능이 제한될 수 있습니다.');
});