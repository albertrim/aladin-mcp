# 알라딘 OpenAPI MCP 서버 개발 실행 계획

## 프로젝트 개요
- **프로젝트명**: 알라딘 OpenAPI MCP 서버
- **기술 스택**: Node.js, TypeScript, MCP SDK
- **목표**: 알라딘 API를 활용한 도서 정보 조회 MCP 서버 구축
- **저장소**: GitHub 저장소 생성 및 관리
- **총 태스크**: 10개 (6개 Phase)

## 📋 기술 명세 및 요구사항

### 환경 요구사항
- **Node.js**: v18.0.0 이상 (MCP SDK 호환)
- **TypeScript**: v5.0.0 이상
- **패키지 매니저**: pnpm v8.0.0 이상
- **운영체제**: Windows 10+, macOS 12+, Ubuntu 20.04+

### 핵심 의존성
- **@modelcontextprotocol/sdk**: ^1.0.0 (MCP 프로토콜)
- **axios**: ^1.6.0 (HTTP 클라이언트)
- **fast-xml-parser**: ^4.3.0 (XML 파싱)
- **csv-parser**: ^3.0.0 (카테고리 CSV 파싱)
- **dotenv**: ^16.0.0 (환경변수)

### 알라딘 API 제약사항
- **일일 호출 한도**: 5,000회
- **응답 형식**: XML, JSON 지원
- **인증 방식**: TTB 키 (Time To Book)
- **API 버전**: 20070901 (고정)

### 📊 알라딘 API 에러 코드 매핑
| 에러 코드 | 설명 | 대응 방법 |
|----------|------|-----------|
| 100 | 잘못된 TTB 키 | API 키 확인 및 재설정 |
| 200 | 필수 파라미터 누락 | 파라미터 검증 강화 |
| 300 | 잘못된 파라미터 값 | 입력값 유효성 검사 |
| 900 | 시스템 오류 | 재시도 또는 관리자 문의 |
| 901 | 일일 호출 한도 초과 | 사용량 제한 알림 |

### 🔧 MCP 도구 스키마 예시
```json
{
  "name": "aladin_search",
  "description": "알라딘에서 도서를 검색합니다",
  "inputSchema": {
    "type": "object",
    "properties": {
      "query": {
        "type": "string",
        "description": "검색할 키워드"
      },
      "queryType": {
        "type": "string",
        "enum": ["Title", "Author", "Publisher", "Keyword"],
        "default": "Title"
      }
    },
    "required": ["query"]
  }
}
```

## Git 워크플로우
- **메인 브랜치**: `main`
- **개발 방식**: 각 Task별 피쳐 브랜치 생성 (`task/1-1-project-setup` 형식)
- **완료 기준**: 각 Task 완료 시 PR 생성 → 검토 → 메인 브랜치 병합
- **커밋 규칙**: Conventional Commits 형식 사용

---

## 🏗️ Phase 1: 프로젝트 기반 구축

### 🔧 Task 1-0: Git 저장소 초기 설정
- [x] GitHub 저장소 생성 (`aladin-mcp`)
- [x] 로컬 Git 저장소 초기화
- [x] 초기 커밋 (README.md, .gitignore 등)
- [x] GitHub 저장소와 연결 (origin 설정)
- [x] 브랜치 보호 규칙 설정 (main 브랜치)

### Task 1-1: 프로젝트 초기 설정 및 구조 생성
**분류**: 백엔드/설정 | **의존성**: Git 저장소 설정 | **브랜치**: `task/1-1-project-setup`

- [x] `pnpm init`으로 package.json 생성
- [x] TypeScript 설정 파일 생성 (tsconfig.json)
- [x] Jest 테스트 환경 설정 (jest.config.js)
- [x] 프로젝트 디렉토리 구조 생성
  - [x] src/ 폴더 생성
  - [x] src/tools/ 폴더 생성
  - [x] src/utils/ 폴더 생성
  - [x] src/constants/ 폴더 생성
  - [x] tests/ 폴더 및 하위 구조 생성
- [x] 환경설정 파일들 생성
  - [x] .env.example (TTB_KEY, LOG_LEVEL, NODE_ENV)
  - [x] .gitignore (node_modules, .env, dist/, logs/) - 이미 존재
  - [x] .npmignore (src/, tests/, *.md, .env*)
  - [x] .nvmrc (Node.js 버전 고정)
  - [x] .editorconfig (코드 스타일 통일)
- [x] 개발 환경 의존성 설치
  - [x] typescript, @types/node, ts-node, nodemon
  - [x] jest, @types/jest
  - [x] eslint, prettier, rimraf
- [x] 프로덕션 의존성 설치
  - [x] @modelcontextprotocol/sdk
  - [x] axios, fast-xml-parser, dotenv
  - [x] csv-parser (CSV 파일 파싱용)
  - [x] winston (로깅 라이브러리)
- [x] 카테고리 데이터 파일 설정
  - [x] aladin_Category_CID_20210927.csv 파일 배치 확인
  - [x] CSV 파일 접근 권한 확인
- [x] Git 작업 완료
  - [x] 모든 변경사항 커밋 (`feat: 프로젝트 초기 설정 및 구조 생성`)
  - [x] PR 생성 (`Task 1-1: 프로젝트 초기 설정 완료`) - PR #1
  - [x] 코드 리뷰 및 main 브랜치 병합

**산출물**: 완전한 프로젝트 구조, 설정 파일들, GitHub PR

---

### Task 1-2: 타입 정의 및 상수 모듈 구현
**분류**: 백엔드/타입정의 | **의존성**: Task 1-1 | **브랜치**: `task/1-2-types-constants`

- [x] 알라딘 API 응답 인터페이스 정의 (src/types.ts)
  - [x] ItemSearch 응답 타입 (검색 결과, totalResults, startIndex, itemsPerPage)
  - [x] ItemLookUp 응답 타입 (상세 정보, item 배열)
  - [x] ItemList 응답 타입 (베스트셀러/신간/추천 등)
  - [x] 공통 item 객체 타입 (title, author, publisher, isbn, cover 등)
  - [x] subInfo 객체 타입 (부가 정보)
- [x] 검색 파라미터 타입 정의
  - [x] Query, QueryType 타입 (Title, Author, Publisher, Keyword)
  - [x] SearchTarget 타입 (Book, Foreign, eBook, Music, DVD)
  - [x] Sort 옵션 (Accuracy, PublishTime, Title, SalesPoint, CustomerRating)
  - [x] Cover 타입 (None, Small, MidBig, Big, None)
  - [x] Output 타입 (XML, JS)
  - [x] Version 타입 (20070901 등)
  - [x] OptResult 타입 (authors, fulldescription, Toc, Story, categoryIdList)
  - [x] 페이지네이션 파라미터 (Start, MaxResults)
- [x] 도서 정보 타입 정의
  - [x] 기본 도서 정보 (제목, 저자, 출판사, ISBN)
  - [x] 추가 정보 (가격, 할인율, 출간일, 설명)
  - [x] 이미지 정보 (표지, 목차)
- [x] 베스트셀러/신간 리스트 타입 정의
  - [x] CategoryId 타입 정의 (aladin_Category_CID_20210927.csv 기반)
  - [x] 카테고리 계층 구조 타입 (1Depth~5Depth)
  - [x] 카테고리 매핑 인터페이스 (CID, 카테고리명, 몰 구분)
  - [x] QueryType 타입 (Bestseller, NewBook, NewSpecial, EditorChoice 등)
  - [x] 기간 타입 정의 (Daily, Weekly, Monthly)
- [x] MCP 도구별 입력/출력 타입 정의
  - [x] MCP 도구 스키마 인터페이스
  - [x] 입력 파라미터 검증 타입
  - [x] 도구 응답 포맷 타입
  - [x] MCP 서버 메타데이터 타입
- [x] 에러 응답 타입 정의
  - [x] errorCode, errorMessage 구조
  - [x] TTB 키 관련 에러 타입
  - [x] API 호출 한도 초과 에러 타입
  - [x] MCP 프로토콜 에러 타입
  - [x] 네트워크 에러 타입
- [x] API 관련 상수 정의 (src/constants/api.ts)
  - [x] API 기본 URL (http://www.aladin.co.kr/ttb/api/)
  - [x] 엔드포인트 (ItemSearch.aspx, ItemLookUp.aspx, ItemList.aspx)
  - [x] SearchTarget 상수 (Book, Foreign, eBook, Music, DVD)
  - [x] Sort 옵션 상수 (Accuracy, PublishTime, Title 등)
  - [x] Cover 크기 상수 (None, Small, MidBig, Big)
  - [x] 기본 파라미터 값 (Version: 20070901, Output: JS 등)
  - [x] 에러 메시지 상수
  - [x] MCP 도구 스키마 상수
- [x] 카테고리 관련 상수/유틸리티 (src/constants/categories.ts)
  - [x] CSV 파일 파싱 유틸리티
  - [x] 카테고리 매핑 테이블 생성
  - [x] 카테고리 검색/조회 유틸리티
  - [x] 계층별 카테고리 필터링 기능
- [x] Git 작업 완료
  - [x] 모든 변경사항 커밋 (`feat: 타입 정의 및 상수 모듈 구현`)
  - [x] PR 생성 (`Task 1-2: 타입 정의 및 상수 모듈 완료`) - PR #2
  - [x] 코드 리뷰 및 main 브랜치 병합

**산출물**: src/types.ts, src/constants/api.ts, src/constants/categories.ts, GitHub PR

---

## ⚙️ Phase 2: 핵심 기능 구현

### 🚀 병렬 처리 지시 (Group 2)
**Task 2-1과 Task 2-2는 서브에이전트를 활용하여 병렬로 처리하세요.**

#### 실행 방법:
```bash
# Claude Code에서 다음과 같이 실행:
# 두 개의 서브에이전트를 동시에 실행하여 병렬 개발 진행

Agent 1: Task 2-1 (알라딘 API 클라이언트 구현)
Agent 2: Task 2-2 (유틸리티 모듈 구현)

# 명령어 예시:
"Task 2-1과 Task 2-2를 병렬로 실행해주세요. 각각 독립적인 에이전트로 동시에 진행하세요."
```

#### 병렬 처리 근거:
- 두 Task 모두 Task 1-2에만 의존
- 서로 독립적인 모듈 (client.ts vs utils/)
- 동시 개발 가능하여 개발 시간 50% 단축

#### 동기화 조건:
- **Phase 3 진행 조건**: Task 2-1, 2-2 모두 완료 및 PR 병합 후

### Task 2-1: 알라딘 API 클라이언트 구현
**분류**: 백엔드/API통합 | **의존성**: Task 1-2 | **브랜치**: `task/2-1-api-client`

- [x] API 기본 설정 (src/client.ts)
  - [x] 알라딘 API 기본 URL (http://www.aladin.co.kr/ttb/api/)
  - [x] TTB 키 환경변수 설정 및 유효성 검증
  - [x] Axios 인스턴스 생성 (기본 파라미터: Version, Output, TTBKey)
  - [x] 요청 인터셉터 (공통 파라미터 자동 추가)
  - [x] 응답 인터셉터 (에러 응답 처리)
- [x] `searchBooks()` - ItemSearch.aspx 호출
  - [x] Query, QueryType, SearchTarget 파라미터 검증
  - [x] Sort, Cover, OptResult 옵션 처리
  - [x] Start, MaxResults 페이지네이션 처리
  - [x] HTTP GET 요청 구현
  - [x] JS/XML 응답 파싱
  - [x] totalResults, itemsPerPage 메타데이터 처리
- [x] `getBookDetails()` - ItemLookUp.aspx 호출
  - [x] ItemId 또는 ISBN13 파라미터 검증
  - [x] OptResult 부가 정보 옵션 처리
  - [x] Cover 이미지 크기 옵션 처리
  - [x] API 호출 구현
  - [x] item 배열에서 단일 객체 추출
- [x] `getBestsellerList()` - ItemList.aspx (Bestseller)
  - [x] CategoryId 분야 코드 검증
  - [x] SearchTarget 대상 검증 (Book, Foreign 등)
  - [x] Year, Month, Week 기간 파라미터 처리
  - [x] API 호출 및 파싱
- [x] `getNewReleasesList()` - ItemList.aspx (NewBook/NewSpecial)
  - [x] CategoryId 분야 코드 처리
  - [x] SearchTarget 대상 처리
  - [x] 날짜 기간 파라미터 처리
  - [x] API 호출 및 결과 처리
- [x] `getItemList()` - ItemList.aspx (추천/편집자 선택 등)
  - [x] QueryType (EditorChoice, ItemNewAll, ItemNewSpecial 등) 처리
  - [x] CategoryId 분야별 조회
  - [x] API 호출 및 결과 처리
- [x] 공통 유틸리티 메서드
  - [x] 알라딘 API 에러 응답 핸들러 (errorCode, errorMessage)
  - [x] TTB 키 유효성 검증 및 보안 저장
  - [x] 일일 호출 한도 추적 및 관리 (로컬 카운터)
  - [x] 요청 재시도 로직 (지수 백오프: 1초, 2초, 4초)
  - [x] Circuit Breaker 패턴 (연속 실패 시 차단)
  - [x] JS/XML 응답 파싱 공통 로직
  - [x] 응답 데이터 정규화 (item 객체 표준화)
  - [x] 입력값 Sanitization (XSS, Injection 방지)
  - [x] 요청 로깅 (민감 정보 마스킹)
  - [x] 캐싱 메커니즘 (LRU, TTL 설정)
- [x] Git 작업 완료
  - [x] 모든 변경사항 커밋 (`feat: 알라딘 API 클라이언트 구현`)
  - [x] PR 생성 (`Task 2-1: 알라딘 API 클라이언트 완료`) - PR #3
  - [x] 코드 리뷰 및 main 브랜치 병합

**산출물**: src/client.ts (완전한 API 클라이언트), GitHub PR

---

### Task 2-2: 유틸리티 모듈 구현
**분류**: 백엔드/유틸리티 | **의존성**: Task 1-2 | **브랜치**: `task/2-2-utilities`

- [x] 검증 유틸리티 (src/utils/validators.ts)
  - [x] ISBN 검증 함수 (ISBN-10, ISBN-13, ItemId)
  - [x] CategoryId 분야 코드 검증 (CSV 파일 기반 실제 CID 확인)
  - [x] 카테고리 계층 구조 검증 (1Depth~5Depth)
  - [x] 카테고리명으로 CID 조회 기능
  - [x] SearchTarget 검증 (Book, Foreign, eBook, Music, DVD)
  - [x] QueryType 검증 (Title, Author, Publisher, Keyword)
  - [x] Sort 옵션 검증 (Accuracy, PublishTime, Title, SalesPoint, CustomerRating)
  - [x] Cover 크기 검증 (None, Small, MidBig, Big)
  - [x] OptResult 옵션 검증 (authors, fulldescription, Toc, Story, categoryIdList)
  - [x] 날짜 형식 검증 (Year, Month, Week)
  - [x] 페이지네이션 파라미터 검증 (Start, MaxResults)
  - [x] TTB 키 형식 검증
- [x] 포맷터 유틸리티 (src/utils/formatters.ts)
  - [x] MCP 응답 표준 포맷터
  - [x] 도서 정보 포맷터
  - [x] 에러 메시지 포맷터
  - [x] 날짜 포맷터
  - [x] 가격 정보 포맷터
- [x] 로깅 유틸리티 (src/utils/logger.ts)
  - [x] 로깅 레벨 설정 (debug, info, warn, error)
  - [x] API 호출 로깅
  - [x] 에러 로깅
  - [x] 사용량 통계 로깅
- [x] Git 작업 완료
  - [x] 모든 변경사항 커밋 (`feat: 유틸리티 모듈 구현`)
  - [x] PR 생성 (`Task 2-2: 유틸리티 모듈 완료`) - PR #4
  - [x] 코드 리뷰 및 main 브랜치 병합

**산출물**: src/utils/ 폴더의 모든 유틸리티 파일들, GitHub PR

---

## 🔧 Phase 3: MCP 서버 구현

### Task 3-1: MCP 도구 구현
**분류**: 백엔드/MCP | **의존성**: Task 2-1, Task 2-2 | **브랜치**: `task/3-1-mcp-tools`

- [ ] **aladin_search**: 키워드로 도서 검색 (ItemSearch.aspx)
  - [ ] 도구 스키마 정의 (Query, QueryType, SearchTarget, Sort, Cover 등)
  - [ ] 입력 파라미터 검증 (필수: Query, 선택: 나머지)
  - [ ] 페이지네이션 지원 (Start, MaxResults)
  - [ ] 검색 결과 포맷팅 (item 배열, 메타데이터 포함)
- [ ] **aladin_book_info**: ISBN/ItemId로 도서 상세 조회 (ItemLookUp.aspx)
  - [ ] ItemId 또는 ISBN13 형식 검증
  - [ ] OptResult 부가 정보 옵션 지원
  - [ ] Cover 이미지 크기 옵션 지원
  - [ ] 상세 정보 조회 및 포맷팅
- [ ] **aladin_bestsellers**: 분야별 베스트셀러 조회 (ItemList.aspx)
  - [ ] CategoryId 분야 코드 검증 (CSV 파일 기반)
  - [ ] 카테고리명으로 CID 조회 지원
  - [ ] SearchTarget 대상 지원
  - [ ] 기간 옵션 (Year, Month, Week) 지원
  - [ ] 베스트셀러 목록 포맷팅
- [ ] **aladin_new_books**: 신간 도서 목록 조회 (ItemList.aspx)
  - [ ] QueryType (NewBook, NewSpecial) 지원
  - [ ] CategoryId 분야별 조회 (CSV 파일 기반)
  - [ ] 카테고리 계층 구조 지원 (1Depth~5Depth)
  - [ ] 날짜 기간 파라미터 처리
  - [ ] 신간 목록 포맷팅
- [ ] **aladin_item_list**: 추천/편집자 선택 등 (ItemList.aspx)
  - [ ] QueryType (EditorChoice, ItemNewAll, ItemNewSpecial 등) 지원
  - [ ] CategoryId 분야별 조회 (CSV 파일 기반)
  - [ ] SearchTarget 대상 지원
  - [ ] 다양한 추천 목록 포맷팅
- [ ] **aladin_categories**: 카테고리 조회/검색 도구
  - [ ] 카테고리명으로 CID 검색
  - [ ] CID로 카테고리 정보 조회
  - [ ] 계층별 하위 카테고리 조회
  - [ ] 카테고리 트리 구조 출력
- [ ] MCP 도구 스키마 정의
  - [ ] 각 도구별 JSON Schema 작성
  - [ ] 입력 파라미터 필수/선택 구분
  - [ ] 파라미터 타입 및 제약 조건 명시
  - [ ] 출력 형식 스키마 정의
- [ ] MCP 도구 설명 및 예제
  - [ ] 도구별 사용법 한국어 설명
  - [ ] 파라미터 사용 예제
  - [ ] 응답 예시 데이터
  - [ ] 에러 상황별 대응법
- [ ] 공통 기능
  - [ ] 응답 데이터 통일된 포맷으로 변환
  - [ ] 에러 메시지 표준화
  - [ ] 도구별 사용법 도움말 추가
- [ ] Git 작업 완료
  - [ ] 모든 변경사항 커밋 (`feat: MCP 도구 구현`)
  - [ ] PR 생성 (`Task 3-1: MCP 도구 완료`)
  - [ ] 코드 리뷰 및 main 브랜치 병합

**산출물**: src/tools/ 폴더의 각 도구 파일들, GitHub PR

---

### Task 3-2: MCP 서버 메인 모듈 구현
**분류**: 백엔드/MCP | **의존성**: Task 3-1 | **브랜치**: `task/3-2-mcp-server`

- [ ] MCP 서버 초기화 (src/index.ts)
  - [ ] MCP 서버 인스턴스 생성
  - [ ] 서버 메타데이터 설정 (이름, 버전)
  - [ ] stdio 전송 설정
- [ ] 도구 등록
  - [ ] 각 도구의 스키마 정의
  - [ ] 도구 핸들러 함수 구현
  - [ ] 도구 등록 및 바인딩
- [ ] 서버 실행
  - [ ] 서버 시작 로직 구현
  - [ ] 연결 상태 관리 및 헬스체크
  - [ ] 종료 신호 처리 (SIGINT, SIGTERM)
  - [ ] Graceful Shutdown 구현
  - [ ] 프로세스 모니터링 (메모리, CPU 사용률)
- [ ] 서버 보안 및 안정성
  - [ ] 입력값 검증 미들웨어
  - [ ] Rate Limiting (도구별 호출 제한)
  - [ ] 에러 경계(Error Boundaries) 설정
  - [ ] 로그 레벨별 출력 제어
  - [ ] 민감 정보 로깅 방지
- [ ] Git 작업 완료
  - [ ] 모든 변경사항 커밋 (`feat: MCP 서버 메인 모듈 구현`)
  - [ ] PR 생성 (`Task 3-2: MCP 서버 메인 모듈 완료`)
  - [ ] 코드 리뷰 및 main 브랜치 병합

**산출물**: src/index.ts (메인 서버 파일), GitHub PR

---

## ✅ Phase 4: 품질 보증

### Task 4-1: 테스트 구현
**분류**: 백엔드/테스트 | **의존성**: Task 2-1, Task 3-1, Task 3-2 | **브랜치**: `task/4-1-testing`

- [ ] Jest 테스트 환경 설정
  - [ ] jest.config.js 설정
  - [ ] TypeScript 지원 설정
  - [ ] 테스트 커버리지 설정
- [ ] 단위 테스트 작성 (tests/unit/)
  - [ ] API 클라이언트 테스트
  - [ ] 각 MCP 도구별 테스트
  - [ ] 유틸리티 함수 테스트
  - [ ] 검증 로직 테스트
- [ ] 통합 테스트 작성 (tests/integration/)
  - [ ] MCP 서버 전체 동작 테스트
  - [ ] 도구 간 연계 테스트
- [ ] 테스트 픽스처 준비 (tests/fixtures/)
  - [ ] 모킹용 API 응답 데이터
  - [ ] 테스트용 도서 정보 데이터
- [ ] 모킹을 통한 API 테스트
  - [ ] Axios 모킹 설정
  - [ ] 다양한 응답 시나리오 테스트 (성공, 실패, 부분 실패)
  - [ ] 에러 상황 테스트 (네트워크 오류, API 오류, 타임아웃)
  - [ ] Rate Limiting 테스트 (일일 한도 초과 시뮬레이션)
- [ ] 성능 및 부하 테스트
  - [ ] API 응답 시간 측정
  - [ ] 동시 요청 처리 테스트
  - [ ] 메모리 누수 검사
  - [ ] 캐시 효율성 테스트
- [ ] E2E (End-to-End) 테스트
  - [ ] 실제 알라딘 API 연동 테스트 (개발 환경)
  - [ ] MCP 프로토콜 전체 플로우 테스트
  - [ ] Claude Desktop 연동 시뮬레이션
  - [ ] 에러 복구 시나리오 테스트
- [ ] Git 작업 완료
  - [ ] 모든 변경사항 커밋 (`feat: 테스트 구현`)
  - [ ] PR 생성 (`Task 4-1: 테스트 구현 완료`)
  - [ ] 코드 리뷰 및 main 브랜치 병합

**산출물**: tests/ 폴더 완전 구현, Jest 설정, GitHub PR

---

### Task 4-2: 에러 처리 및 로깅 강화
**분류**: 백엔드/품질 | **의존성**: Task 2-1, Task 2-2 | **브랜치**: `task/4-2-error-handling`

- [ ] 알라딘 API 제한사항 관리
  - [ ] 일일 5,000회 호출 제한 추적
  - [ ] TTB 키별 사용량 모니터링
  - [ ] 요청 빈도 제한 구현 (Rate Limiting)
  - [ ] API 키 유효성 실시간 검증
  - [ ] 호출 한도 도달 시 적절한 에러 메시지
- [ ] 알라딘 API 특화 에러 처리
  - [ ] errorCode 기반 에러 분류
  - [ ] errorMessage 한글 메시지 처리
  - [ ] TTB 키 관련 에러 (100: 잘못된 TTB키)
  - [ ] 파라미터 에러 (200: 필수 파라미터 누락)
  - [ ] 시스템 에러 (900: 시스템 오류) 처리
- [ ] 네트워크 에러 처리
  - [ ] 연결 타임아웃 처리 (알라딘 서버 응답 지연)
  - [ ] 재시도 로직 구현 (지수 백오프)
  - [ ] 백오프 전략 (1초, 2초, 4초)
- [ ] 파라미터 검증 에러 처리
  - [ ] 필수 파라미터 누락 검증 (Query, TTBKey)
  - [ ] CategoryId 범위 검증 (0~999)
  - [ ] ISBN 형식 검증 (10자리/13자리)
  - [ ] SearchTarget 열거형 검증
  - [ ] MaxResults 범위 검증 (1~50)
- [ ] MCP 프로토콜 에러 처리
  - [ ] 도구 호출 에러
  - [ ] 스키마 유효성 검사 에러
  - [ ] 알라딘 API 응답을 MCP 에러로 변환
- [ ] Git 작업 완료
  - [ ] 모든 변경사항 커밋 (`feat: 에러 처리 및 로깅 강화`)
  - [ ] PR 생성 (`Task 4-2: 에러 처리 및 로깅 강화 완료`)
  - [ ] 코드 리뷰 및 main 브랜치 병합

**산출물**: 강화된 에러 처리 및 로깅 시스템, GitHub PR

---

### 🚀 병렬 처리 지시 (Group 4)
**Task 4-1과 Task 4-2는 서브에이전트를 활용하여 병렬로 처리하세요.**

#### 실행 방법:
```bash
# Claude Code에서 다음과 같이 실행:
# 두 개의 서브에이전트를 동시에 실행하여 병렬 개발 진행

Agent 1: Task 4-1 (테스트 구현)
Agent 2: Task 4-2 (에러 처리 및 로깅 강화)

# 명령어 예시:
"Task 4-1과 Task 4-2를 병렬로 실행해주세요. 각각 독립적인 에이전트로 동시에 진행하세요."
```

#### 병렬 처리 근거:
- Task 4-1: Task 2-1, 3-1, 3-2에 의존 (테스트 대상)
- Task 4-2: Task 2-1, 2-2에 의존 (에러 처리 대상)
- 서로 다른 영역 (tests/ vs 에러 처리 로직)
- 독립적 개발 가능하여 개발 시간 40% 단축

#### 동기화 조건:
- **Phase 5 진행 조건**: Task 4-1, 4-2 모두 완료 및 PR 병합 후
- Task 5-1은 Task 4-1 의존, Task 5-2는 Task 4-1과 5-1 의존

---

## 📚 Phase 5: 문서화 및 배포

### Task 5-1: 문서화 작성
**분류**: 기타/문서화 | **의존성**: Task 3-2, Task 4-1 | **브랜치**: `task/5-1-documentation`

- [ ] README.md 작성
  - [ ] 프로젝트 개요 및 목적
  - [ ] 설치 방법 및 요구사항
  - [ ] 알라딘 API 키 설정 방법
  - [ ] Claude Desktop 연동 방법
  - [ ] 사용법 및 예제
  - [ ] 문제해결 (Troubleshooting)
- [ ] API 문서 작성
  - [ ] 각 MCP 도구별 상세 문서
  - [ ] 파라미터 설명
  - [ ] 응답 형식 설명
  - [ ] 사용 예제
- [ ] 개발자 가이드 작성
  - [ ] 프로젝트 구조 설명
  - [ ] 기여 방법
  - [ ] 코딩 스타일 가이드
- [ ] 환경변수 설정 가이드 (.env.example)
- [ ] 변경 로그 (CHANGELOG.md) 준비
- [ ] Git 작업 완료
  - [ ] 모든 변경사항 커밋 (`docs: 문서화 작성 완료`)
  - [ ] PR 생성 (`Task 5-1: 문서화 작성 완료`)
  - [ ] 코드 리뷰 및 main 브랜치 병합

**산출물**: 완전한 문서화 세트, GitHub PR

---

### Task 5-2: 빌드 및 배포 설정
**분류**: 백엔드/배포 | **의존성**: Task 4-1, Task 5-1 | **브랜치**: `task/5-2-build-deploy`

- [ ] TypeScript 컴파일 설정 최적화
  - [ ] 프로덕션용 tsconfig.json
  - [ ] 소스맵 설정
  - [ ] 불필요한 타입 정의 제거
- [ ] 빌드 스크립트 작성
  - [ ] 빌드 전 린팅 및 테스트 실행
  - [ ] 빌드 후 검증
  - [ ] 배포용 파일 복사
- [ ] 번들링 및 최적화
  - [ ] 의존성 번들링
  - [ ] 코드 압축 (minification)
  - [ ] Tree shaking
- [ ] Claude Desktop 연동 설정
  - [ ] claude_desktop_config.json 예시
  - [ ] 서버 경로 및 실행 방법 정의
  - [ ] 환경변수 설정 방법
- [ ] 연동 테스트 수행
  - [ ] 기본 연결 테스트
  - [ ] 각 도구별 동작 테스트
  - [ ] 에러 상황 테스트
- [ ] npm 패키지 배포 준비
  - [ ] package.json 완성
  - [ ] 키워드 및 설명 추가
  - [ ] 라이선스 설정
  - [ ] 저장소 URL 설정
- [ ] 배포 스크립트 작성
  - [ ] 자동 빌드 및 테스트
  - [ ] Semantic Versioning 자동 적용
  - [ ] 버전 태깅 및 릴리스 노트 생성
  - [ ] 배포 후 검증 (헬스체크, 기능 테스트)
- [ ] 모니터링 및 알림 설정
  - [ ] 로그 수집 및 분석 시스템
  - [ ] 에러 추적 (Error Tracking)
  - [ ] 성능 메트릭 수집
  - [ ] 알림 시스템 (에러 발생 시)
- [ ] 백업 및 복구 절차
  - [ ] 설정 파일 백업
  - [ ] 로그 파일 관리 및 회전
  - [ ] 장애 복구 매뉴얼 작성
- [ ] Git 작업 완료
  - [ ] 모든 변경사항 커밋 (`feat: 빌드 및 배포 설정 완료`)
  - [ ] PR 생성 (`Task 5-2: 빌드 및 배포 설정 완료`)
  - [ ] 코드 리뷰 및 main 브랜치 병합

**산출물**: 완전한 빌드 및 배포 시스템, GitHub PR

---

## 🚀 Phase 6: 고도화 (선택사항)

### Task 6-1: 성능 최적화
**분류**: 백엔드/최적화 | **의존성**: Task 5-2 | **브랜치**: `task/6-1-optimization`

- [ ] 캐싱 시스템 구현
  - [ ] 메모리 캐시 (LRU)
  - [ ] 파일 기반 캐시
  - [ ] 캐시 무효화 전략
- [ ] 요청 최적화
  - [ ] 요청 배칭
  - [ ] 중복 요청 방지
  - [ ] 응답 압축
- [ ] 성능 메트릭 수집
  - [ ] API 응답 시간 측정
  - [ ] 메모리 사용량 모니터링
  - [ ] 캐시 히트율 추적
- [ ] Git 작업 완료
  - [ ] 모든 변경사항 커밋 (`perf: 성능 최적화 구현`)
  - [ ] PR 생성 (`Task 6-1: 성능 최적화 완료`)
  - [ ] 코드 리뷰 및 main 브랜치 병합

**산출물**: 성능 최적화된 버전, GitHub PR

---

### Task 6-2: 고급 기능 추가
**분류**: 백엔드/기능확장 | **의존성**: Task 6-1 | **브랜치**: `task/6-2-advanced-features`

- [ ] 사용자 경험 개선
  - [ ] 검색 결과 필터링 기능
  - [ ] 가격 범위 필터
  - [ ] 출간일 필터
  - [ ] 출판사 필터
- [ ] 다국어 지원
  - [ ] 에러 메시지 다국어화
  - [ ] 도구 설명 다국어화
- [ ] 진보된 검색 기능
  - [ ] 자동완성 제안
  - [ ] 유사 검색어 제안
- [ ] 보안 강화
  - [ ] API 키 보안 강화
  - [ ] 키 로테이션 지원
  - [ ] 입력 데이터 sanitization
  - [ ] 사용량 제한 및 throttling
- [ ] 모니터링 및 분석
  - [ ] 사용 패턴 분석
  - [ ] 에러 추적
  - [ ] 동적 설정 로딩
- [ ] Git 작업 완료
  - [ ] 모든 변경사항 커밋 (`feat: 고급 기능 추가`)
  - [ ] PR 생성 (`Task 6-2: 고급 기능 추가 완료`)
  - [ ] 코드 리뷰 및 main 브랜치 병합

**산출물**: 고급 기능이 추가된 완전한 버전, GitHub PR

---

## 📊 진행 상황 요약

- **Phase 1**: ✅ 프로젝트 기반 구축 (3개 태스크) - Task 1-0 ✅, Task 1-1 ✅, Task 1-2 ✅ 완료
- **Phase 2**: ✅ 핵심 기능 구현 (2개 태스크) - Task 2-1 ✅, Task 2-2 ✅ 완료
- **Phase 3**: ⬜ MCP 서버 구현 (2개 태스크)
- **Phase 4**: ⬜ 품질 보증 (2개 태스크)
- **Phase 5**: ⬜ 문서화 및 배포 (2개 태스크)
- **Phase 6**: ⬜ 고도화 선택사항 (2개 태스크)

**총 MCP 도구**: 6개 (aladin_search, aladin_book_info, aladin_bestsellers, aladin_new_books, aladin_item_list, aladin_categories)
**전체 진행률**: 5/13 완료 (38.5%)

---

## 🚀 병렬 처리 요약

### 병렬 처리 가능한 Phase:
```
Phase 2 (Group 2): Task 2-1 || Task 2-2  ⚡ 50% 시간 단축
Phase 4 (Group 4): Task 4-1 || Task 4-2  ⚡ 40% 시간 단축
```

### 서브에이전트 활용 명령어:
```bash
# Phase 2 병렬 실행:
"Task 2-1 (API 클라이언트)과 Task 2-2 (유틸리티)를 병렬로 실행해주세요."

# Phase 4 병렬 실행:
"Task 4-1 (테스트)과 Task 4-2 (에러 처리)를 병렬로 실행해주세요."
```

### ⚠️ 병렬 처리 시 주의사항:
1. **Git 브랜치 충돌 방지**: 각 Task는 독립된 브랜치 사용
2. **PR 순서**: 병렬 Task 모두 완료 후 다음 Phase 진행
3. **코드 리뷰**: 각 Task별 독립적 리뷰 후 병합
4. **의존성 확인**: 병렬 Task 완료 후 의존 Task 진행 가능 여부 확인

---

## 🔄 Git 워크플로우 상세

### 브랜치 전략
- **main**: 프로덕션 준비 완료 코드
- **task/X-Y-description**: 각 Task별 개발 브랜치

### PR 워크플로우
1. **브랜치 생성**: `git checkout -b task/1-1-project-setup`
2. **개발 진행**: Task의 모든 체크리스트 완료
3. **커밋**: Conventional Commits 규칙 준수
   - `feat:` 새로운 기능
   - `fix:` 버그 수정
   - `docs:` 문서 작성
   - `test:` 테스트 추가
   - `refactor:` 코드 리팩토링
   - `perf:` 성능 개선
4. **PR 생성**: GitHub에서 Pull Request 생성
5. **코드 리뷰**: 자체 검토 또는 팀 리뷰
6. **병합**: main 브랜치로 병합
7. **브랜치 정리**: 완료된 브랜치 삭제

### 🚀 병렬 처리 워크플로우
```bash
# Phase 2 병렬 처리 예시:
main ─┬─ task/2-1-api-client ────── 동시 개발 → PR#3
      └─ task/2-2-utilities ──────── 동시 개발 → PR#4
                │                        │
                └────── 두 PR 모두 병합 후 Phase 3 진행

# Phase 4 병렬 처리 예시:
main ─┬─ task/4-1-testing ────────── 동시 개발 → PR#7
      └─ task/4-2-error-handling ─── 동시 개발 → PR#8
                │                        │
                └────── 두 PR 모두 병합 후 Phase 5 진행
```

### 커밋 메시지 예시
```
feat: 프로젝트 초기 설정 및 구조 생성

- package.json 및 TypeScript 설정 추가
- 프로젝트 디렉토리 구조 생성
- 필수 의존성 패키지 설치
- 환경설정 파일 생성

Closes #1
```

### PR 템플릿
```markdown
## Task 완료 내용
- [ ] 모든 체크리스트 항목 완료
- [ ] 단위 테스트 작성 및 통과
- [ ] 통합 테스트 통과
- [ ] 린트 검사 통과 (ESLint, Prettier)
- [ ] 타입 검사 통과 (TypeScript)
- [ ] 보안 검사 완료
- [ ] 성능 검사 완료
- [ ] 문서 업데이트

## 변경 사항
- 주요 변경 내용 설명
- Breaking Changes (있는 경우)
- 의존성 변경사항

## 테스트 방법
- 테스트 실행 방법 설명
- E2E 테스트 시나리오
- 수동 테스트 체크포인트

## 보안 고려사항
- 민감 정보 처리 방법
- 입력값 검증 로직
- 권한 관리 변경사항

## 성능 영향
- 예상 성능 영향도
- 메모리 사용량 변화
- API 호출 횟수 변화

## 관련 이슈
- Closes #이슈번호
- Related to #이슈번호
```

### 🔍 코드 리뷰 체크리스트

#### 기능성 검토
- [ ] 요구사항 완전 구현 여부
- [ ] 에지 케이스 처리
- [ ] 에러 처리 적정성
- [ ] 입력값 검증 완전성

#### 코드 품질 검토
- [ ] 코드 가독성 및 명명 규칙
- [ ] 함수/클래스 크기 적정성
- [ ] 중복 코드 제거
- [ ] 주석 및 문서화 적절성

#### 보안 검토
- [ ] SQL Injection 방지
- [ ] XSS 방지
- [ ] 민감 정보 노출 방지
- [ ] 접근 권한 검증

#### 성능 검토
- [ ] 알고리즘 효율성
- [ ] 메모리 사용 최적화
- [ ] API 호출 최소화
- [ ] 캐싱 전략 적절성

#### 테스트 검토
- [ ] 테스트 커버리지 80% 이상
- [ ] 단위 테스트 품질
- [ ] 통합 테스트 시나리오
- [ ] Mock 데이터 적절성

---

## 📋 프로젝트 관리 가이드

### 🐛 이슈 템플릿

#### 버그 리포트
```markdown
## 버그 설명
간단하고 명확한 버그 설명

## 재현 단계
1. '...' 으로 이동
2. '....' 클릭
3. '....' 까지 스크롤
4. 에러 발생

## 예상 동작
발생해야 할 동작 설명

## 실제 동작
실제 발생한 동작 설명

## 환경 정보
- OS: [예: macOS 13.0]
- Node.js: [예: v18.17.0]
- 버전: [예: v1.2.3]

## 추가 정보
스크린샷, 로그 등
```

#### 기능 요청
```markdown
## 기능 설명
새로운 기능에 대한 간단한 설명

## 동기
이 기능이 왜 필요한지 설명

## 상세 설명
기능의 상세한 동작 방식

## 대안
고려한 다른 대안들

## 우선순위
- [ ] Critical (즉시 필요)
- [ ] High (다음 릴리스)
- [ ] Medium (향후 계획)
- [ ] Low (선택사항)
```

### 🏷️ 라벨 시스템
- **Type**: `bug`, `feature`, `enhancement`, `documentation`
- **Priority**: `critical`, `high`, `medium`, `low`
- **Status**: `needs-review`, `in-progress`, `blocked`, `ready`
- **Area**: `api`, `mcp`, `security`, `performance`, `testing`

### 📈 릴리스 프로세스
1. **버전 계획**: Semantic Versioning 적용
   - Major (X.0.0): Breaking Changes
   - Minor (0.X.0): 새로운 기능
   - Patch (0.0.X): 버그 수정

2. **릴리스 체크리스트**:
   - [ ] 모든 테스트 통과
   - [ ] 문서 업데이트
   - [ ] CHANGELOG 작성
   - [ ] 보안 검토 완료
   - [ ] 성능 테스트 통과

3. **배포 후 모니터링**:
   - [ ] 에러 로그 모니터링 (24시간)
   - [ ] 성능 지표 확인
   - [ ] 사용자 피드백 수집

### 🔄 지속적 개선
- **주간 리뷰**: 진행 상황 및 이슈 점검
- **월간 회고**: 개선점 및 교훈 정리
- **분기별 계획**: 로드맵 업데이트