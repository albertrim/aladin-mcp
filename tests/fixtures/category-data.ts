/**
 * 카테고리 관련 테스트 데이터
 * 알라딘 카테고리 CSV 파일을 기반으로 한 테스트용 카테고리 데이터
 */

import type {
  CategoryCsvRow,
  ParsedCategory,
  CategorySearchResult
} from '../../src/types.js';

// ===== CSV 원본 데이터 형태 픽스처 =====

export const mockCategoryCsvRows: CategoryCsvRow[] = [
  {
    CID: 1,
    '1Depth': '국내도서',
    '2Depth': '',
    '3Depth': '',
    '4Depth': '',
    '5Depth': '',
    '몰구분': 'BOOK'
  },
  {
    CID: 50,
    '1Depth': '국내도서',
    '2Depth': '컴퓨터/인터넷',
    '3Depth': '',
    '4Depth': '',
    '5Depth': '',
    '몰구분': 'BOOK'
  },
  {
    CID: 351,
    '1Depth': '국내도서',
    '2Depth': '컴퓨터/인터넷',
    '3Depth': '프로그래밍/개발',
    '4Depth': '',
    '5Depth': '',
    '몰구분': 'BOOK'
  },
  {
    CID: 1230,
    '1Depth': '국내도서',
    '2Depth': '컴퓨터/인터넷',
    '3Depth': '프로그래밍/개발',
    '4Depth': '소프트웨어 공학',
    '5Depth': '',
    '몰구분': 'BOOK'
  },
  {
    CID: 2,
    '1Depth': '국내도서',
    '2Depth': '소설',
    '3Depth': '',
    '4Depth': '',
    '5Depth': '',
    '몰구분': 'BOOK'
  },
  {
    CID: 74,
    '1Depth': '국내도서',
    '2Depth': '소설',
    '3Depth': '한국소설',
    '4Depth': '',
    '5Depth': '',
    '몰구분': 'BOOK'
  },
  {
    CID: 987,
    '1Depth': '국내도서',
    '2Depth': '소설',
    '3Depth': '한국소설',
    '4Depth': '현대소설',
    '5Depth': '',
    '몰구분': 'BOOK'
  },
  {
    CID: 170,
    '1Depth': '외국도서',
    '2Depth': '',
    '3Depth': '',
    '4Depth': '',
    '5Depth': '',
    '몰구분': 'FOREIGN'
  },
  {
    CID: 171,
    '1Depth': '외국도서',
    '2Depth': 'Computer Science',
    '3Depth': '',
    '4Depth': '',
    '5Depth': '',
    '몰구분': 'FOREIGN'
  },
  {
    CID: 172,
    '1Depth': '외국도서',
    '2Depth': 'Computer Science',
    '3Depth': 'Programming',
    '4Depth': '',
    '5Depth': '',
    '몰구분': 'FOREIGN'
  }
];

// ===== 파싱된 카테고리 데이터 =====

export const mockParsedCategories: ParsedCategory[] = [
  {
    id: 1,
    name: '국내도서',
    depth: 1,
    fullPath: ['국내도서'],
    mallType: 'BOOK'
  },
  {
    id: 50,
    name: '컴퓨터/인터넷',
    depth: 2,
    parentId: 1,
    parentName: '국내도서',
    fullPath: ['국내도서', '컴퓨터/인터넷'],
    mallType: 'BOOK'
  },
  {
    id: 351,
    name: '프로그래밍/개발',
    depth: 3,
    parentId: 50,
    parentName: '컴퓨터/인터넷',
    fullPath: ['국내도서', '컴퓨터/인터넷', '프로그래밍/개발'],
    mallType: 'BOOK'
  },
  {
    id: 1230,
    name: '소프트웨어 공학',
    depth: 4,
    parentId: 351,
    parentName: '프로그래밍/개발',
    fullPath: ['국내도서', '컴퓨터/인터넷', '프로그래밍/개발', '소프트웨어 공학'],
    mallType: 'BOOK'
  },
  {
    id: 2,
    name: '소설',
    depth: 2,
    parentId: 1,
    parentName: '국내도서',
    fullPath: ['국내도서', '소설'],
    mallType: 'BOOK'
  },
  {
    id: 74,
    name: '한국소설',
    depth: 3,
    parentId: 2,
    parentName: '소설',
    fullPath: ['국내도서', '소설', '한국소설'],
    mallType: 'BOOK'
  },
  {
    id: 987,
    name: '현대소설',
    depth: 4,
    parentId: 74,
    parentName: '한국소설',
    fullPath: ['국내도서', '소설', '한국소설', '현대소설'],
    mallType: 'BOOK'
  },
  {
    id: 170,
    name: '외국도서',
    depth: 1,
    fullPath: ['외국도서'],
    mallType: 'FOREIGN'
  },
  {
    id: 171,
    name: 'Computer Science',
    depth: 2,
    parentId: 170,
    parentName: '외국도서',
    fullPath: ['외국도서', 'Computer Science'],
    mallType: 'FOREIGN'
  },
  {
    id: 172,
    name: 'Programming',
    depth: 3,
    parentId: 171,
    parentName: 'Computer Science',
    fullPath: ['외국도서', 'Computer Science', 'Programming'],
    mallType: 'FOREIGN'
  }
];

// ===== 카테고리 검색 결과 픽스처 =====

export const mockCategorySearchResults: Record<string, CategorySearchResult> = {
  programming: {
    categories: [
      {
        id: 351,
        name: '프로그래밍/개발',
        depth: 3,
        parentId: 50,
        parentName: '컴퓨터/인터넷',
        fullPath: ['국내도서', '컴퓨터/인터넷', '프로그래밍/개발'],
        mallType: 'BOOK'
      },
      {
        id: 172,
        name: 'Programming',
        depth: 3,
        parentId: 171,
        parentName: 'Computer Science',
        fullPath: ['외국도서', 'Computer Science', 'Programming'],
        mallType: 'FOREIGN'
      }
    ],
    totalCount: 2
  },
  computer: {
    categories: [
      {
        id: 50,
        name: '컴퓨터/인터넷',
        depth: 2,
        parentId: 1,
        parentName: '국내도서',
        fullPath: ['국내도서', '컴퓨터/인터넷'],
        mallType: 'BOOK'
      },
      {
        id: 171,
        name: 'Computer Science',
        depth: 2,
        parentId: 170,
        parentName: '외국도서',
        fullPath: ['외국도서', 'Computer Science'],
        mallType: 'FOREIGN'
      }
    ],
    totalCount: 2
  },
  novel: {
    categories: [
      {
        id: 2,
        name: '소설',
        depth: 2,
        parentId: 1,
        parentName: '국내도서',
        fullPath: ['국내도서', '소설'],
        mallType: 'BOOK'
      },
      {
        id: 74,
        name: '한국소설',
        depth: 3,
        parentId: 2,
        parentName: '소설',
        fullPath: ['국내도서', '소설', '한국소설'],
        mallType: 'BOOK'
      },
      {
        id: 987,
        name: '현대소설',
        depth: 4,
        parentId: 74,
        parentName: '한국소설',
        fullPath: ['국내도서', '소설', '한국소설', '현대소설'],
        mallType: 'BOOK'
      }
    ],
    totalCount: 3
  },
  notFound: {
    categories: [],
    totalCount: 0
  }
};

// ===== 카테고리 트리 구조 테스트용 데이터 =====

export const mockCategoryTree = {
  '1': {
    category: mockParsedCategories[0], // 국내도서
    children: {
      '50': {
        category: mockParsedCategories[1], // 컴퓨터/인터넷
        children: {
          '351': {
            category: mockParsedCategories[2], // 프로그래밍/개발
            children: {
              '1230': {
                category: mockParsedCategories[3], // 소프트웨어 공학
                children: {}
              }
            }
          }
        }
      },
      '2': {
        category: mockParsedCategories[4], // 소설
        children: {
          '74': {
            category: mockParsedCategories[5], // 한국소설
            children: {
              '987': {
                category: mockParsedCategories[6], // 현대소설
                children: {}
              }
            }
          }
        }
      }
    }
  },
  '170': {
    category: mockParsedCategories[7], // 외국도서
    children: {
      '171': {
        category: mockParsedCategories[8], // Computer Science
        children: {
          '172': {
            category: mockParsedCategories[9], // Programming
            children: {}
          }
        }
      }
    }
  }
};

// ===== CSV 원본 문자열 데이터 =====

export const mockCategoryCsvString = `CID,1Depth,2Depth,3Depth,4Depth,5Depth,몰구분
1,국내도서,,,,,BOOK
50,국내도서,컴퓨터/인터넷,,,,BOOK
351,국내도서,컴퓨터/인터넷,프로그래밍/개발,,,BOOK
1230,국내도서,컴퓨터/인터넷,프로그래밍/개발,소프트웨어 공학,,BOOK
2,국내도서,소설,,,,BOOK
74,국내도서,소설,한국소설,,,BOOK
987,국내도서,소설,한국소설,현대소설,,BOOK
170,외국도서,,,,,FOREIGN
171,외국도서,Computer Science,,,,FOREIGN
172,외국도서,Computer Science,Programming,,,FOREIGN`;

// ===== 테스트 시나리오용 데이터 =====

export const categoryTestScenarios = {
  validQueries: {
    exactMatch: '프로그래밍/개발',
    partialMatch: '프로그래밍',
    englishCategory: 'Programming',
    multipleResults: '소설'
  },
  invalidQueries: {
    empty: '',
    notFound: '존재하지않는카테고리',
    tooShort: 'a',
    specialChars: '!@#$%'
  },
  validCategoryIds: [1, 50, 351, 1230, 2, 74, 987, 170, 171, 172],
  invalidCategoryIds: [-1, 0, 999999, 'invalid'],
  depthLevels: {
    depth1: [1, 170],
    depth2: [50, 2, 171],
    depth3: [351, 74, 172],
    depth4: [1230, 987]
  },
  mallTypes: {
    BOOK: [1, 50, 351, 1230, 2, 74, 987],
    FOREIGN: [170, 171, 172]
  }
};

// ===== 대용량 카테고리 데이터 생성 함수 =====

export const generateMockCategories = (count: number): ParsedCategory[] => {
  return Array.from({ length: count }, (_, index) => ({
    id: 10000 + index,
    name: `테스트 카테고리 ${index + 1}`,
    depth: Math.floor(index / 100) + 1,
    parentId: index > 0 ? 10000 + Math.floor(index / 10) : undefined,
    parentName: index > 0 ? `테스트 카테고리 ${Math.floor(index / 10) + 1}` : undefined,
    fullPath: [`테스트 카테고리 ${index + 1}`],
    mallType: index % 2 === 0 ? 'BOOK' : 'FOREIGN'
  }));
};

export const generateMockCsvRows = (count: number): CategoryCsvRow[] => {
  return Array.from({ length: count }, (_, index) => ({
    CID: 10000 + index,
    '1Depth': '테스트도서',
    '2Depth': index > 0 ? `2단계 ${Math.floor(index / 10) + 1}` : '',
    '3Depth': index > 10 ? `3단계 ${Math.floor(index / 100) + 1}` : '',
    '4Depth': index > 100 ? `4단계 ${Math.floor(index / 1000) + 1}` : '',
    '5Depth': '',
    '몰구분': index % 2 === 0 ? 'BOOK' : 'FOREIGN'
  }));
};