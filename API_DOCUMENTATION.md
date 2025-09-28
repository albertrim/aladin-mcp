# 🔧 알라딘 MCP 서버 API 문서

이 문서는 알라딘 MCP 서버에서 제공하는 6가지 MCP 도구의 상세한 사용법과 파라미터를 설명합니다.

## 📋 목차

1. [aladin_search](#1-aladin_search) - 도서 검색
2. [aladin_book_info](#2-aladin_book_info) - 도서 상세 정보 조회
3. [aladin_bestsellers](#3-aladin_bestsellers) - 베스트셀러 목록
4. [aladin_new_books](#4-aladin_new_books) - 신간 도서 목록
5. [aladin_item_list](#5-aladin_item_list) - 추천/편집자 선택 목록
6. [aladin_categories](#6-aladin_categories) - 카테고리 정보

---

## 1. aladin_search

### 📖 설명
키워드, 저자, 출판사 등으로 도서를 검색합니다.

### 📥 입력 파라미터

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|----------|------|------|--------|------|
| `query` | string | ✅ | - | 검색할 키워드 |
| `queryType` | string | ❌ | "Title" | 검색 유형 |
| `searchTarget` | string | ❌ | "Book" | 검색 대상 |
| `sort` | string | ❌ | "Accuracy" | 정렬 옵션 |
| `cover` | string | ❌ | "Small" | 표지 이미지 크기 |
| `start` | number | ❌ | 1 | 시작 페이지 |
| `maxResults` | number | ❌ | 10 | 최대 결과 수 (1-50) |

### 📊 열거형 값

#### queryType
- `"Title"`: 제목 검색
- `"Author"`: 저자 검색
- `"Publisher"`: 출판사 검색
- `"Keyword"`: 키워드 검색

#### searchTarget
- `"Book"`: 국내도서
- `"Foreign"`: 외국도서
- `"eBook"`: 전자책
- `"Music"`: 음반
- `"DVD"`: DVD

#### sort
- `"Accuracy"`: 정확도순
- `"PublishTime"`: 출간일순
- `"Title"`: 제목순
- `"SalesPoint"`: 판매량순
- `"CustomerRating"`: 평점순

#### cover
- `"None"`: 표지 없음
- `"Small"`: 소형 (85x120)
- `"MidBig"`: 중형 (120x170)
- `"Big"`: 대형 (200x290)

### 📤 응답 형식

```typescript
interface SearchResponse {
  totalResults: number;
  startIndex: number;
  itemsPerPage: number;
  items: BookItem[];
}

interface BookItem {
  title: string;
  author: string;
  publisher: string;
  isbn: string;
  isbn13: string;
  priceStandard: number;
  priceSales: number;
  cover: string;
  pubDate: string;
  description: string;
  categoryName: string;
  link: string;
}
```

### 💡 사용 예제

```typescript
// Claude Desktop에서 사용
"프로그래밍 관련 도서를 검색해주세요"
"저자가 '로버트 마틴'인 도서를 찾아주세요"
"한빛미디어에서 출간한 도서를 보여주세요"

// API 직접 호출
{
  "query": "클린 코드",
  "queryType": "Title",
  "searchTarget": "Book",
  "sort": "SalesPoint",
  "maxResults": 20
}
```

---

## 2. aladin_book_info

### 📖 설명
ISBN 또는 ItemId로 특정 도서의 상세 정보를 조회합니다.

### 📥 입력 파라미터

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|----------|------|------|--------|------|
| `isbn13` | string | ✅* | - | ISBN-13 (13자리) |
| `itemId` | string | ✅* | - | 알라딘 상품 ID |
| `cover` | string | ❌ | "Small" | 표지 이미지 크기 |
| `optResult` | string[] | ❌ | [] | 추가 정보 옵션 |

*`isbn13` 또는 `itemId` 중 하나는 필수

### 📊 열거형 값

#### cover
- `"None"`, `"Small"`, `"MidBig"`, `"Big"` (aladin_search와 동일)

#### optResult
- `"authors"`: 저자 상세 정보
- `"fulldescription"`: 상세 설명
- `"Toc"`: 목차
- `"Story"`: 책 소개
- `"categoryIdList"`: 카테고리 ID 목록

### 📤 응답 형식

```typescript
interface BookInfoResponse {
  item: DetailedBookItem;
}

interface DetailedBookItem extends BookItem {
  subInfo?: {
    authors?: AuthorInfo[];
    toc?: string;
    story?: string;
    categoryIdList?: number[];
    fulldescription?: string;
  };
}

interface AuthorInfo {
  authorName: string;
  authorType: string;
  authorInfo: string;
}
```

### 💡 사용 예제

```typescript
// Claude Desktop에서 사용
"ISBN 9788966262267 도서의 상세 정보를 알려주세요"
"이 도서의 목차와 상세 설명을 포함해서 보여주세요"

// API 직접 호출
{
  "isbn13": "9788966262267",
  "cover": "Big",
  "optResult": ["fulldescription", "Toc", "authors"]
}
```

---

## 3. aladin_bestsellers

### 📖 설명
분야별 베스트셀러 목록을 조회합니다.

### 📥 입력 파라미터

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|----------|------|------|--------|------|
| `categoryId` | number | ❌ | 0 | 카테고리 ID (0=전체) |
| `searchTarget` | string | ❌ | "Book" | 검색 대상 |
| `year` | number | ❌ | 현재년도 | 연도 |
| `month` | number | ❌ | 현재월 | 월 (1-12) |
| `week` | number | ❌ | 현재주 | 주 (1-5) |
| `cover` | string | ❌ | "Small" | 표지 이미지 크기 |
| `maxResults` | number | ❌ | 20 | 최대 결과 수 (1-100) |

### 📊 주요 카테고리 ID

| 카테고리 | ID | 설명 |
|----------|-------|------|
| 전체 | 0 | 모든 분야 |
| 소설 | 1 | 국내/해외 소설 |
| 시/에세이 | 2 | 시, 에세이, 기행 |
| 예술/대중문화 | 3 | 예술, 디자인, 대중문화 |
| 사회과학 | 4 | 정치, 사회, 문화 |
| 역사와 문화 | 5 | 역사, 문화, 종교 |
| 철학/심리학 | 6 | 철학, 심리학, 교육 |
| 과학 | 7 | 과학, 기술, 의학 |
| 컴퓨터/IT | 8 | 프로그래밍, IT 기술 |
| 경제경영 | 9 | 경제, 경영, 마케팅 |

### 📤 응답 형식

```typescript
interface BestsellerResponse {
  item: BestsellerItem[];
}

interface BestsellerItem extends BookItem {
  rank: number;
  rankingWeek: string;
}
```

### 💡 사용 예제

```typescript
// Claude Desktop에서 사용
"IT 분야의 베스트셀러를 보여주세요"
"이번 달 소설 베스트셀러 10권을 알려주세요"
"전체 분야의 연간 베스트셀러를 보여주세요"

// API 직접 호출
{
  "categoryId": 8,
  "searchTarget": "Book",
  "maxResults": 10,
  "cover": "MidBig"
}
```

---

## 4. aladin_new_books

### 📖 설명
신간 도서 및 특별전 목록을 조회합니다.

### 📥 입력 파라미터

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|----------|------|------|--------|------|
| `queryType` | string | ❌ | "NewBook" | 신간 조회 유형 |
| `categoryId` | number | ❌ | 0 | 카테고리 ID |
| `searchTarget` | string | ❌ | "Book" | 검색 대상 |
| `cover` | string | ❌ | "Small" | 표지 이미지 크기 |
| `maxResults` | number | ❌ | 20 | 최대 결과 수 |

### 📊 열거형 값

#### queryType
- `"NewBook"`: 신간 도서
- `"NewSpecial"`: 신간 특별전
- `"NewAll"`: 모든 신간

### 📤 응답 형식

```typescript
interface NewBookResponse {
  item: NewBookItem[];
}

interface NewBookItem extends BookItem {
  isNew: boolean;
  specialEvent?: string;
}
```

### 💡 사용 예제

```typescript
// Claude Desktop에서 사용
"최근 출간된 프로그래밍 도서를 보여주세요"
"이번 주 신간 특별전 도서를 알려주세요"

// API 직접 호출
{
  "queryType": "NewBook",
  "categoryId": 8,
  "maxResults": 15
}
```

---

## 5. aladin_item_list

### 📖 설명
편집자 추천, 주목할만한 신간 등 큐레이션된 도서 목록을 조회합니다.

### 📥 입력 파라미터

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|----------|------|------|--------|------|
| `queryType` | string | ❌ | "EditorChoice" | 목록 유형 |
| `categoryId` | number | ❌ | 0 | 카테고리 ID |
| `searchTarget` | string | ❌ | "Book" | 검색 대상 |
| `cover` | string | ❌ | "Small" | 표지 이미지 크기 |
| `maxResults` | number | ❌ | 20 | 최대 결과 수 |

### 📊 열거형 값

#### queryType
- `"EditorChoice"`: 편집자 추천
- `"ItemNewAll"`: 주목할만한 신간
- `"ItemNewSpecial"`: 신간 특별전
- `"BlogBest"`: 블로거 베스트

### 📤 응답 형식

```typescript
interface ItemListResponse {
  item: RecommendedItem[];
}

interface RecommendedItem extends BookItem {
  recommendReason?: string;
  editorComment?: string;
}
```

### 💡 사용 예제

```typescript
// Claude Desktop에서 사용
"편집자가 추천하는 도서를 보여주세요"
"블로거들이 추천하는 IT 도서를 알려주세요"

// API 직접 호출
{
  "queryType": "EditorChoice",
  "categoryId": 8,
  "maxResults": 10
}
```

---

## 6. aladin_categories

### 📖 설명
도서 카테고리 정보를 조회하고 검색합니다.

### 📥 입력 파라미터

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|----------|------|------|--------|------|
| `action` | string | ✅ | - | 수행할 액션 |
| `categoryName` | string | ❌ | - | 카테고리명 (search 시) |
| `categoryId` | number | ❌ | - | 카테고리 ID (info 시) |

### 📊 열거형 값

#### action
- `"search"`: 카테고리명으로 검색
- `"info"`: 카테고리 ID로 정보 조회
- `"list"`: 전체 카테고리 목록
- `"tree"`: 카테고리 트리 구조

### 📤 응답 형식

```typescript
interface CategoryResponse {
  categories: CategoryInfo[];
}

interface CategoryInfo {
  categoryId: number;
  categoryName: string;
  depth: number;
  parentId?: number;
  children?: CategoryInfo[];
  mallType: string;
}
```

### 💡 사용 예제

```typescript
// Claude Desktop에서 사용
"프로그래밍 관련 카테고리를 찾아주세요"
"컴퓨터/IT 카테고리의 하위 분류를 보여주세요"
"전체 카테고리 구조를 알려주세요"

// API 직접 호출
{
  "action": "search",
  "categoryName": "프로그래밍"
}

{
  "action": "info",
  "categoryId": 8
}
```

---

## 🔒 에러 처리

### 공통 에러 코드

| 코드 | 설명 | 해결 방법 |
|------|------|-----------|
| 100 | 잘못된 TTB 키 | API 키 확인 |
| 200 | 필수 파라미터 누락 | 파라미터 검증 |
| 300 | 잘못된 파라미터 값 | 입력값 확인 |
| 900 | 시스템 오류 | 재시도 |
| 901 | 일일 호출 한도 초과 | 사용량 제한 |

### 에러 응답 형식

```typescript
interface ErrorResponse {
  error: {
    code: number;
    message: string;
    details?: any;
  };
}
```

## 🚀 성능 고려사항

### 최적화 팁

1. **캐싱**: 동일한 요청은 캐시된 결과 활용
2. **배치 처리**: 여러 도서 조회 시 한 번에 처리
3. **필드 선택**: 필요한 정보만 `optResult`로 요청
4. **페이지네이션**: 큰 결과 집합은 페이지별로 분할 조회

### API 제한사항

- **일일 호출 한도**: 5,000회
- **동시 연결 수**: 제한 없음
- **응답 시간**: 평균 1-3초
- **데이터 업데이트**: 매일 새벽 3시

---

이 문서는 알라딘 MCP 서버 v1.0.0 기준으로 작성되었습니다. 최신 정보는 [GitHub 저장소](https://github.com/albertrim/aladin-mcp)를 참조하세요.