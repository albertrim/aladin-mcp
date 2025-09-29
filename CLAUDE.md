# CLAUDE.md

이 파일은 Claude Code가 이 저장소에서 작업할 때 참고해야 할 지침을 제공합니다.

## 🌐 언어 설정

**중요: Claude는 이 프로젝트에서 한국어로 답변해야 합니다.**
- 모든 설명, 코멘트, 에러 메시지는 한국어로 작성
- 변수명, 함수명 등 코드 내용은 영어 사용 (국제 표준 준수)
- Git 커밋 메시지는 한국어로 작성 (예: "feat: 도서 검색 기능 추가")
- README.md 및 문서는 한국어로 작성

## 📚 프로젝트 개요

알라딘 OpenAPI용 MCP(Model Context Protocol) 서버 - Node.js와 TypeScript 기반으로 개발된 도서 정보 조회 시스템입니다.

## ⚡ 핵심 개발 명령어

```bash
# 프로젝트 시작
pnpm install          # 의존성 설치
pnpm dev              # 개발 서버 실행

# 품질 검사
pnpm test             # 테스트 실행
pnpm lint             # 코드 검사
pnpm type-check       # 타입 체크

# 빌드 및 배포
pnpm build            # 빌드
pnpm start            # 프로덕션 실행
```

## 🏗️ 프로젝트 구조

```
aladin-mcp-server/
├── src/
│   ├── index.ts         # MCP 서버 진입점
│   ├── client.ts        # 알라딘 API 클라이언트
│   ├── types.ts         # 타입 정의
│   ├── tools/           # MCP 도구들
│   ├── utils/           # 유틸리티 함수들
│   └── constants/       # 상수 정의
├── data/                # CSV 파일 (카테고리 정보)
├── tests/               # 테스트 파일들
├── .env.example         # 환경변수 설정 예시
├── EXECUTION.md         # 상세한 실행 계획
└── package.json
```

## 🔑 환경 설정

### 필수 환경 변수
- **TTB_KEY**: `your_aladin_api_key_here` (알라딘 API 키)
- TTB_KEY로 개인키를 사용하지 말 것
- **NODE_ENV**: `development` 또는 `production`
- **LOG_LEVEL**: `debug`, `info`, `warn`, `error`

### API 제한사항
- 일일 호출 한도: 5,000회
- API 기본 URL: `http://www.aladin.co.kr/ttb/api/`
- 응답 형식: XML, JSON 지원

## 🛠️ MCP 도구

제공되는 4가지 핵심 도구:

1. **aladin_search**: 도서 검색 (키워드, 저자, 출판사 등)
2. **aladin_book_info**: ISBN으로 상세 정보 조회
3. **aladin_bestsellers**: 분야별 베스트셀러 목록
4. **aladin_new_books**: 신간 도서 목록

## 📋 개발 지침

### 코드 스타일
- **함수명/변수명**: 영어 camelCase 사용
- **주석/문서**: 모든 주석과 문서는 한국어로 작성
- **에러 메시지**: 사용자 친화적인 한국어 메시지
- **로그**: 한국어로 상황 설명

### 커밋 메시지 규칙
```bash
feat: 도서 검색 기능 추가
fix: API 호출 제한 오류 수정
docs: README.md 업데이트
test: 단위 테스트 추가
refactor: 코드 구조 개선
```

### 품질 보증
- **타입 안전성**: 모든 함수와 변수에 적절한 타입 지정
- **에러 핸들링**: 예상되는 모든 에러 상황 처리
- **테스트 커버리지**: 80% 이상 유지
- **API 제한**: 일일 5,000회 호출 제한 준수

## 🔍 문제 해결

상세한 실행 계획과 구현 가이드는 `EXECUTION.md` 참고.
기술적 문제나 버그 발생 시 GitHub Issues에 한국어로 보고.