/**
 * 알라딘 API 응답 모킹용 픽스처 데이터
 * 실제 알라딘 API 응답 구조를 기반으로 한 테스트 데이터
 */

import type {
  SearchResponse,
  LookupResponse,
  ListResponse,
  CompleteBookItem,
  SubInfo,
  Author,
  CategoryInfo,
  AladinApiError
} from '../../src/types.js';

// ===== 기본 도서 정보 픽스처 =====

export const mockBookItem: CompleteBookItem = {
  itemId: 269508618,
  title: "클린 코드",
  link: "http://www.aladin.co.kr/shop/wproduct.aspx?ItemId=269508618",
  author: "로버트 C. 마틴 (지은이), 박재호, 이해영 (옮긴이)",
  pubDate: "2013-12-24",
  description: "애자일 소프트웨어 장인 정신의 핵심을 다룬 클린 코드 작성법",
  isbn: "8966260950",
  isbn13: "9788966260959",
  priceSales: 27000,
  priceStandard: 30000,
  mallType: "BOOK",
  stockStatus: "현재 판매중",
  mileage: 1500,
  cover: "https://image.aladin.co.kr/product/26950/86/cover500/8966260950_1.jpg",
  categoryId: 351,
  categoryName: "국내도서 > 컴퓨터/인터넷 > 프로그래밍/개발 > 소프트웨어 공학",
  publisher: "인사이트",
  salesPoint: 23540,
  adult: false,
  fixedPrice: true,
  customerReviewRank: 9,
  bestDuration: "2021년 1월 4주",
  bestRank: 1,
  subInfo: {
    authors: [
      {
        authorId: 123456,
        authorName: "로버트 C. 마틴",
        authorType: "지은이",
        authorInfo: "소프트웨어 장인, 애자일 소프트웨어 개발 전문가"
      },
      {
        authorId: 234567,
        authorName: "박재호",
        authorType: "옮긴이",
        authorInfo: "번역가, 소프트웨어 개발자"
      },
      {
        authorId: 345678,
        authorName: "이해영",
        authorType: "옮긴이",
        authorInfo: "번역가, 소프트웨어 개발자"
      }
    ],
    fulldescription: "애자일 소프트웨어 장인 정신의 핵심을 다룬 클린 코드 작성법을 소개합니다. 나쁜 코드가 개발 속도를 늦추고 프로젝트를 망치는 사례를 살펴보고, 좋은 코드를 작성하는 원칙과 패턴을 배웁니다.",
    toc: "1장 깨끗한 코드\\n2장 의미 있는 이름\\n3장 함수\\n4장 주석\\n5장 형식 맞추기",
    story: "로버트 C. 마틴이 40여 년간의 프로그래밍 경험을 바탕으로 작성한 클린 코드의 지침서",
    categoryIdList: [
      { categoryId: 351, categoryName: "소프트웨어 공학", categoryDepth: 4 },
      { categoryId: 50, categoryName: "프로그래밍/개발", categoryDepth: 3 },
      { categoryId: 1, categoryName: "컴퓨터/인터넷", categoryDepth: 2 }
    ],
    ratingInfo: {
      ratingScore: 9.2,
      ratingCount: 1250,
      commentReviewCount: 450,
      myReviewCount: 23
    },
    bestSellerRank: [
      {
        categoryId: 351,
        categoryName: "소프트웨어 공학",
        bestRank: 1,
        period: "월간"
      }
    ]
  }
};

export const mockBookItem2: CompleteBookItem = {
  itemId: 123456789,
  title: "이펙티브 자바",
  link: "http://www.aladin.co.kr/shop/wproduct.aspx?ItemId=123456789",
  author: "조슈아 블로크 (지은이), 개앞맵시 (옮긴이)",
  pubDate: "2018-11-01",
  description: "자바 플랫폼 설계자가 알려주는 자바 프로그래밍 기법",
  isbn: "8966262287",
  isbn13: "9788966262281",
  priceSales: 32400,
  priceStandard: 36000,
  mallType: "BOOK",
  stockStatus: "현재 판매중",
  mileage: 1800,
  cover: "https://image.aladin.co.kr/product/12345/67/cover500/8966262287_1.jpg",
  categoryId: 352,
  categoryName: "국내도서 > 컴퓨터/인터넷 > 프로그래밍/개발 > 자바",
  publisher: "인사이트",
  salesPoint: 19820,
  adult: false,
  fixedPrice: true,
  customerReviewRank: 10,
  subInfo: {
    authors: [
      {
        authorId: 456789,
        authorName: "조슈아 블로크",
        authorType: "지은이",
        authorInfo: "자바 플랫폼 수석 아키텍트"
      },
      {
        authorId: 567890,
        authorName: "개앞맵시",
        authorType: "옮긴이",
        authorInfo: "번역가, 자바 전문가"
      }
    ]
  }
};

// ===== 검색 응답 픽스처 =====

export const mockSearchResponse: SearchResponse = {
  version: "20070901",
  title: "알라딘 검색결과 - 클린 코드",
  link: "http://www.aladin.co.kr/ttb/api/ItemSearch.aspx",
  pubDate: "2024-01-15T10:30:00+09:00",
  totalResults: 1,
  startIndex: 1,
  itemsPerPage: 10,
  query: "클린 코드",
  item: [mockBookItem]
};

export const mockEmptySearchResponse: SearchResponse = {
  version: "20070901",
  title: "알라딘 검색결과 - 존재하지않는도서",
  link: "http://www.aladin.co.kr/ttb/api/ItemSearch.aspx",
  pubDate: "2024-01-15T10:30:00+09:00",
  totalResults: 0,
  startIndex: 1,
  itemsPerPage: 10,
  query: "존재하지않는도서",
  item: []
};

export const mockMultipleSearchResponse: SearchResponse = {
  version: "20070901",
  title: "알라딘 검색결과 - 자바",
  link: "http://www.aladin.co.kr/ttb/api/ItemSearch.aspx",
  pubDate: "2024-01-15T10:30:00+09:00",
  totalResults: 2,
  startIndex: 1,
  itemsPerPage: 10,
  query: "자바",
  item: [mockBookItem, mockBookItem2]
};

// ===== 상세 조회 응답 픽스처 =====

export const mockLookupResponse: LookupResponse = {
  version: "20070901",
  title: "알라딘 상품조회 - 269508618",
  link: "http://www.aladin.co.kr/ttb/api/ItemLookUp.aspx",
  pubDate: "2024-01-15T10:30:00+09:00",
  item: [mockBookItem]
};

export const mockEmptyLookupResponse: LookupResponse = {
  version: "20070901",
  title: "알라딘 상품조회 - 999999999",
  link: "http://www.aladin.co.kr/ttb/api/ItemLookUp.aspx",
  pubDate: "2024-01-15T10:30:00+09:00",
  item: []
};

// ===== 리스트 조회 응답 픽스처 =====

export const mockBestsellerResponse: ListResponse = {
  version: "20070901",
  title: "알라딘 베스트셀러",
  link: "http://www.aladin.co.kr/ttb/api/ItemList.aspx",
  pubDate: "2024-01-15T10:30:00+09:00",
  item: [mockBookItem, mockBookItem2]
};

export const mockNewBooksResponse: ListResponse = {
  version: "20070901",
  title: "알라딘 신간도서",
  link: "http://www.aladin.co.kr/ttb/api/ItemList.aspx",
  pubDate: "2024-01-15T10:30:00+09:00",
  item: [mockBookItem2]
};

// ===== 에러 응답 픽스처 =====

export const mockApiErrors: Record<string, AladinApiError> = {
  invalidTtbKey: {
    errorCode: 100,
    errorMessage: "TTB_KEY is invalid"
  },
  missingParam: {
    errorCode: 200,
    errorMessage: "Required parameter is missing"
  },
  invalidParam: {
    errorCode: 300,
    errorMessage: "Invalid parameter value"
  },
  systemError: {
    errorCode: 900,
    errorMessage: "Internal server error"
  },
  dailyLimitExceeded: {
    errorCode: 901,
    errorMessage: "Daily API call limit exceeded"
  }
};

// ===== XML 응답 픽스처 (원본 API 응답 형태) =====

export const mockXmlSearchResponse = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>알라딘 검색결과 - 클린 코드</title>
    <link>http://www.aladin.co.kr/ttb/api/ItemSearch.aspx</link>
    <description>알라딘 검색결과 - 클린 코드</description>
    <pubDate>2024-01-15T10:30:00+09:00</pubDate>
    <totalResults>1</totalResults>
    <startIndex>1</startIndex>
    <itemsPerPage>10</itemsPerPage>
    <query>클린 코드</query>
    <version>20070901</version>
    <item>
      <title>클린 코드</title>
      <link>http://www.aladin.co.kr/shop/wproduct.aspx?ItemId=269508618</link>
      <author>로버트 C. 마틴 (지은이), 박재호, 이해영 (옮긴이)</author>
      <pubDate>2013-12-24</pubDate>
      <description>애자일 소프트웨어 장인 정신의 핵심을 다룬 클린 코드 작성법</description>
      <isbn>8966260950</isbn>
      <isbn13>9788966260959</isbn>
      <itemId>269508618</itemId>
      <priceSales>27000</priceSales>
      <priceStandard>30000</priceStandard>
      <mallType>BOOK</mallType>
      <stockStatus>현재 판매중</stockStatus>
      <mileage>1500</mileage>
      <cover>https://image.aladin.co.kr/product/26950/86/cover500/8966260950_1.jpg</cover>
      <categoryId>351</categoryId>
      <categoryName>국내도서 > 컴퓨터/인터넷 > 프로그래밍/개발 > 소프트웨어 공학</categoryName>
      <publisher>인사이트</publisher>
      <salesPoint>23540</salesPoint>
      <adult>false</adult>
      <fixedPrice>true</fixedPrice>
      <customerReviewRank>9</customerReviewRank>
    </item>
  </channel>
</rss>`;

export const mockXmlErrorResponse = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>알라딘 API 오류</title>
    <errorCode>100</errorCode>
    <errorMessage>TTB_KEY is invalid</errorMessage>
  </channel>
</rss>`;

// ===== HTTP 응답 모킹용 데이터 =====

export const mockAxiosResponses = {
  search: {
    status: 200,
    statusText: 'OK',
    data: mockSearchResponse,
    headers: {
      'content-type': 'application/json; charset=utf-8'
    }
  },
  lookup: {
    status: 200,
    statusText: 'OK',
    data: mockLookupResponse,
    headers: {
      'content-type': 'application/json; charset=utf-8'
    }
  },
  bestseller: {
    status: 200,
    statusText: 'OK',
    data: mockBestsellerResponse,
    headers: {
      'content-type': 'application/json; charset=utf-8'
    }
  },
  error400: {
    status: 400,
    statusText: 'Bad Request',
    data: mockApiErrors.missingParam
  },
  error401: {
    status: 401,
    statusText: 'Unauthorized',
    data: mockApiErrors.invalidTtbKey
  },
  error500: {
    status: 500,
    statusText: 'Internal Server Error',
    data: mockApiErrors.systemError
  },
  error429: {
    status: 429,
    statusText: 'Too Many Requests',
    data: mockApiErrors.dailyLimitExceeded
  }
};

// ===== 테스트 시나리오용 데이터 =====

export const testScenarios = {
  validSearchParams: {
    Query: "클린 코드",
    QueryType: "Title" as const,
    SearchTarget: "Book" as const,
    MaxResults: 10
  },
  validLookupParams: {
    ItemId: "9788966260959",
    ItemIdType: "ISBN13" as const
  },
  validListParams: {
    QueryType: "Bestseller" as const,
    CategoryId: 351
  },
  invalidParams: {
    emptyQuery: { Query: "" },
    invalidIsbn: { ItemId: "invalid-isbn" },
    invalidCategoryId: { CategoryId: -1 }
  }
};

// ===== 성능 테스트용 대용량 데이터 =====

export const generateMockBooks = (count: number): CompleteBookItem[] => {
  return Array.from({ length: count }, (_, index) => ({
    ...mockBookItem,
    itemId: mockBookItem.itemId + index,
    title: `${mockBookItem.title} ${index + 1}`,
    isbn: `${mockBookItem.isbn.slice(0, -3)}${String(index).padStart(3, '0')}`,
    isbn13: `${mockBookItem.isbn13.slice(0, -4)}${String(index).padStart(4, '0')}`
  }));
};

export const mockLargeSearchResponse = (count: number): SearchResponse => ({
  ...mockSearchResponse,
  totalResults: count,
  itemsPerPage: count,
  item: generateMockBooks(count)
});