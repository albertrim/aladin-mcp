/**
 * aladin_categories MCP 도구
 *
 * 카테고리명 또는 CID로 카테고리 정보를 조회합니다.
 */

import type {
  AladinCategoriesInput,
  McpToolResponse,
  CategorySearchResult,
  ValidationResult
} from '../types.js';
import { validateAladinCategoriesInput } from '../utils/validators.js';
import { getCategoryById, getCategoriesByName, getSubCategories } from '../constants/categories.js';
import { formatMcpSuccessResponse, formatMcpErrorResponse } from '../utils/formatters.js';
import { getLogger } from '../utils/logger.js';

const logger = getLogger();

/**
 * aladin_categories 도구 핸들러
 */
export async function handleAladinCategories(input: AladinCategoriesInput): Promise<McpToolResponse<CategorySearchResult>> {
  try {
    // 입력값 검증
    logger.info('aladin_categories 입력값 검증', { input });
    const validation: ValidationResult = await validateAladinCategoriesInput(input);
    if (!validation.isValid) {
      logger.warn('aladin_categories 입력값 검증 실패', { errors: validation.errors, input });
      return formatMcpErrorResponse({
        code: 300,
        message: `입력값 검증 실패: ${validation.errors.join(', ')}`,
        timestamp: new Date().toISOString()
      });
    }

    // 카테고리 정보 조회
    let categories: import('../types').ParsedCategory[] = [];
    if (input.categoryId !== undefined) {
      const category = await getCategoryById(input.categoryId);
      if (category) categories.push(category);
    } else if (input.categoryName) {
      categories = await getCategoriesByName(input.categoryName);
    }

    // 하위 카테고리 조회 (depth 지정 시)
    if (input.depth !== undefined && categories.length > 0) {
      categories = await getSubCategories(categories[0].name);
    }

    const result: CategorySearchResult = {
      categories,
      totalCount: categories.length
    };

    const endTime = Date.now();
    logger.info('aladin_categories 성공', {
      resultCount: categories.length,
      searchType: input.categoryId ? 'by_id' : 'by_name'
    });

    return formatMcpSuccessResponse(result);

  } catch (error: any) {
    logger.error('aladin_categories 실행 중 오류 발생', error, { input });
    return formatMcpErrorResponse({
      code: error.code || 900,
      message: `카테고리 정보 조회 중 오류가 발생했습니다: ${error.message}`,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * aladin_categories 도구 메타데이터
 */
export const ALADIN_CATEGORIES_TOOL = {
  name: 'aladin_categories',
  description: '카테고리명 또는 CID로 카테고리 정보를 조회합니다.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      categoryName: {
        type: 'string' as const,
        description: '카테고리명 (선택사항)'
      },
      categoryId: {
        type: 'number' as const,
        description: '카테고리 ID (선택사항)'
      },
      depth: {
        type: 'number' as const,
        description: '하위 카테고리 계층 깊이 (선택사항)',
        minimum: 1,
        maximum: 5
      }
    }
  }
};