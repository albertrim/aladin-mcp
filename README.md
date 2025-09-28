# 🔍 알라딘 OpenAPI MCP 서버

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-%3E%3D5.0.0-blue)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![MCP Protocol](https://img.shields.io/badge/MCP-1.0-orange)](https://modelcontextprotocol.io)

> **알라딘 OpenAPI를 활용한 전문 도서 정보 조회 MCP(Model Context Protocol) 서버**
> Claude Desktop과 완벽 연동하여 실시간 도서 검색, 상세 정보, 베스트셀러 등의 기능을 제공합니다.

## 🎯 프로젝트 개요

알라딘 MCP 서버는 대한민국 최대 온라인 서점인 알라딘의 OpenAPI를 활용하여 Claude AI와 원활한 도서 정보 조회를 가능하게 하는 전문 서버입니다.

### ✨ 핵심 특징
- **실시간 API 연동**: 알라딘의 최신 도서 데이터 실시간 조회
- **완전한 TypeScript 지원**: 타입 안전성과 개발 생산성 보장
- **포괄적 에러 처리**: 강화된 오류 처리 및 복구 메커니즘
- **성능 최적화**: Rate Limiting과 캐싱으로 최적화된 성능
- **Claude Desktop 네이티브 지원**: 원클릭 설정으로 즉시 사용 가능

## 🚀 주요 기능

### 📚 도서 검색 및 조회
- **통합 검색**: 제목, 저자, 출판사, 키워드 등 다양한 검색 옵션
- **상세 정보**: ISBN-10/13으로 정확한 도서 정보 조회
- **고급 필터링**: 정렬 옵션 (정확도, 출간일, 판매량, 평점)
- **표지 이미지**: 다양한 크기의 도서 표지 제공

### 📊 베스트셀러 & 신간
- **실시간 베스트셀러**: 분야별/전체 베스트셀러 순위
- **신간 도서**: 최신 출간 도서 목록 및 특별전
- **편집자 추천**: 큐레이션된 도서 추천 목록
- **카테고리별 조회**: 세분화된 장르별 도서 목록

### 🏷️ 카테고리 시스템
- **계층적 분류**: 5단계 깊이의 상세 카테고리 구조
- **카테고리 검색**: 카테고리명으로 CID 조회
- **브라우징**: 카테고리 트리 탐색 기능

## 📋 시스템 요구사항

### 환경 요구사항
- **Node.js**: v18.0.0 이상 (LTS 권장)
- **TypeScript**: v5.0.0 이상
- **패키지 매니저**: pnpm v8.0.0 이상
- **운영체제**: Windows 10+, macOS 12+, Ubuntu 20.04+

### API 요구사항
- **알라딘 TTB 키**: [알라딘 OpenAPI 신청](http://blog.aladin.co.kr/openapi) 필요
- **일일 호출 한도**: 5,000회 (알라딘 API 제한)

## 🛠️ 빠른 시작

### 1. 프로젝트 설치
```bash
# 저장소 클론
git clone https://github.com/albertrim/aladin-mcp.git
cd aladin-mcp

# 의존성 설치
pnpm install
```

### 2. 환경 설정
```bash
# 환경변수 파일 생성
cp .env.example .env

# .env 파일 편집 (알라딘 TTB 키 설정)
TTB_KEY=your_aladin_api_key_here
NODE_ENV=development
LOG_LEVEL=info
```

### 3. 프로젝트 빌드 및 실행
```bash
# TypeScript 빌드
pnpm build

# 프로덕션 모드 실행
pnpm start

# 또는 개발 모드 실행 (Hot Reload)
pnpm dev
```

### 4. 테스트 실행
```bash
# 전체 테스트 실행
pnpm test

# 테스트 커버리지 확인
pnpm test:coverage

# 코드 품질 검사
pnpm lint && pnpm type-check
```

## 🔧 MCP 도구

이 서버는 다음 6가지 MCP 도구를 제공합니다:

1. **aladin_search** - 도서 검색
2. **aladin_book_info** - 도서 상세 정보 조회
3. **aladin_bestsellers** - 베스트셀러 목록
4. **aladin_new_books** - 신간 도서 목록
5. **aladin_item_list** - 추천/편집자 선택 목록
6. **aladin_categories** - 카테고리 정보

## 🖥️ Claude Desktop 연동

### 자동 설정 (권장)
프로젝트에서 제공하는 설정 파일을 사용하세요:

```bash
# 프로젝트 루트에서 설정 파일 복사
cp claude_desktop_config.json %APPDATA%\Claude\claude_desktop_config.json  # Windows
cp claude_desktop_config.json ~/Library/Application\ Support/Claude/claude_desktop_config.json  # macOS
```

### 수동 설정
Claude Desktop 설정 파일을 직접 편집:

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "aladin-mcp": {
      "command": "node",
      "args": [
        "dist/index.js"
      ],
      "cwd": "C:\\path\\to\\aladin-mcp",
      "env": {
        "TTB_KEY": "ttbalbert.rim1712001",
        "NODE_ENV": "development",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

### 연동 확인
1. **Claude Desktop 재시작** (필수)
2. 새 채팅에서 다음 명령어 테스트:
   ```
   안녕하세요! 알라딘 도서 검색이 가능한가요?
   "프로그래밍" 관련 도서를 검색해주세요.
   ```

## 📚 사용 예제

### 기본 도서 검색
```
"해리포터"로 도서를 검색해주세요.
IT 분야의 베스트셀러 10권을 보여주세요.
ISBN 9788983920720 도서의 상세 정보를 알려주세요.
```

### 고급 검색
```
저자가 "로버트 마틴"인 도서를 찾아주세요.
출판사 "한빛미디어"의 신간 도서 목록을 보여주세요.
컴퓨터/IT 카테고리의 하위 분류를 알려주세요.
```

### 프로그래밍 API 사용 예제

```javascript
import { AladinApiClient } from './src/client.js';

const client = new AladinApiClient();

// 도서 검색
const searchResult = await client.searchBooks({
  query: "해리포터",
  queryType: "Title",
  searchTarget: "Book",
  maxResults: 10
});

// 도서 상세 정보
const bookInfo = await client.getBookDetails({
  isbn13: "9788983920720",
  cover: "Big",
  optResult: ["fulldescription", "Toc"]
});

// 베스트셀러 목록
const bestsellers = await client.getBestsellerList({
  categoryId: 100,  // 소설 분야
  searchTarget: "Book",
  maxResults: 20
});
```

## 🧪 테스트

```bash
# 단위 테스트 실행
pnpm test

# 테스트 커버리지 확인
pnpm test:coverage

# 린트 검사
pnpm lint

# 타입 체크
pnpm type-check

# 모든 검사 한번에 실행
pnpm test && pnpm lint && pnpm type-check
```

## 🔧 문제해결 (Troubleshooting)

### Claude Desktop 연결 문제

#### 🚫 MCP 서버가 연결되지 않는 경우
```bash
# 1. 빌드 파일 확인
ls dist/index.js

# 2. 서버 수동 실행 테스트
pnpm dev

# 3. 설정 파일 JSON 유효성 검사
node -e "console.log(JSON.parse(require('fs').readFileSync('claude_desktop_config.json', 'utf8')))"
```

**해결 방법**:
- Claude Desktop을 완전히 재시작
- 설정 파일 경로가 정확한지 확인
- JSON 문법 오류 확인 (특히 백슬래시 이스케이프)

#### 🔑 API 키 관련 오류
```
Error: Invalid TTB Key (errorCode: 100)
```

**해결 방법**:
- `.env` 파일에 올바른 TTB_KEY 설정 확인
- [알라딘 OpenAPI](http://blog.aladin.co.kr/openapi)에서 키 유효성 확인
- 환경변수가 Claude Desktop에 올바르게 전달되는지 확인

#### 📊 API 호출 한도 초과
```
Error: Daily API limit exceeded (errorCode: 901)
```

**해결 방법**:
- 일일 5,000회 호출 한도 확인
- 다음 날까지 대기 또는 API 사용량 최적화
- 캐싱 활용으로 중복 호출 방지

### 개발 환경 문제

#### Node.js 버전 호환성
```bash
# Node.js 버전 확인
node --version  # v18.0.0 이상 필요

# nvm으로 올바른 버전 설치 (선택사항)
nvm install 18
nvm use 18
```

#### TypeScript 컴파일 오류
```bash
# 타입 정의 재설치
pnpm install --frozen-lockfile

# TypeScript 캐시 정리
rm -rf node_modules/.cache
pnpm build
```

#### 테스트 실행 오류
```bash
# Jest 캐시 정리
pnpm test --clearCache

# ES Module 관련 오류 시
export NODE_OPTIONS="--loader ts-node/esm"
pnpm test
```

### 성능 최적화

#### 응답 속도 개선
- **캐싱 활용**: 동일한 요청의 결과를 메모리에 캐시
- **배치 요청**: 여러 도서 조회 시 한 번에 처리
- **필드 선택**: 필요한 정보만 요청 (optResult 활용)

#### 메모리 사용량 최적화
```bash
# 메모리 사용량 모니터링
node --inspect dist/index.js

# 힙 덤프 생성 (문제 분석용)
kill -USR2 <process_id>
```

### 로그 분석

#### 디버그 로그 활성화
```bash
# 상세 로그로 실행
LOG_LEVEL=debug pnpm dev

# 로그 파일 위치
tail -f logs/aladin-mcp.log
```

#### 일반적인 에러 코드
- **100**: 잘못된 TTB 키
- **200**: 필수 파라미터 누락
- **300**: 잘못된 파라미터 값
- **900**: 알라딘 시스템 오류
- **901**: 일일 호출 한도 초과

### 추가 지원

문제가 해결되지 않으면:
1. [GitHub Issues](https://github.com/albertrim/aladin-mcp/issues)에 문제 보고
2. 로그 파일과 설정 정보 첨부
3. 운영체제 및 Node.js 버전 명시

## 🔧 MCP 도구 상세 설명

| 도구명 | 기능 | 주요 파라미터 | 사용 예시 |
|--------|------|---------------|-----------|
| `aladin_search` | 도서 검색 | query, queryType, searchTarget | 키워드로 도서 찾기 |
| `aladin_book_info` | 상세 정보 조회 | isbn13, optResult, cover | ISBN으로 정확한 정보 |
| `aladin_bestsellers` | 베스트셀러 목록 | categoryId, searchTarget | 분야별 인기 도서 |
| `aladin_new_books` | 신간 도서 목록 | categoryId, queryType | 최신 출간 도서 |
| `aladin_item_list` | 추천 도서 목록 | queryType, categoryId | 편집자 추천 등 |
| `aladin_categories` | 카테고리 정보 | 검색/조회 기능 | 분야 및 장르 탐색 |

## 📖 관련 문서

### 📋 프로젝트 문서
- **[개발 계획서](./PLAN.md)**: 프로젝트 전체 계획 및 아키텍처
- **[실행 계획서](./EXECUTION.md)**: 상세한 태스크별 실행 계획
- **[개발 지침](./CLAUDE.md)**: Claude Code 작업 지침
- **[Claude Desktop 설정 가이드](./CLAUDE_DESKTOP_SETUP.md)**: 연동 상세 가이드

### 📚 API 문서
- **[알라딘 OpenAPI 공식 문서](http://blog.aladin.co.kr/openapi)**
- **[MCP 프로토콜 명세](https://modelcontextprotocol.io)**
- **[TypeScript 공식 문서](https://www.typescriptlang.org/docs/)**

## 🏗️ 프로젝트 구조

```
aladin-mcp/
├── 📁 src/                    # 소스 코드
│   ├── 📄 index.ts           # MCP 서버 진입점
│   ├── 📄 client.ts          # 알라딘 API 클라이언트
│   ├── 📄 types.ts           # TypeScript 타입 정의
│   ├── 📁 tools/             # MCP 도구 구현
│   ├── 📁 utils/             # 유틸리티 함수들
│   └── 📁 constants/         # 상수 및 설정
├── 📁 tests/                 # 테스트 파일들
│   ├── 📁 unit/              # 단위 테스트
│   ├── 📁 integration/       # 통합 테스트
│   └── 📁 fixtures/          # 테스트 데이터
├── 📁 data/                  # CSV 데이터 파일
├── 📁 dist/                  # 빌드된 JavaScript 파일
├── 📁 logs/                  # 로그 파일 (런타임 생성)
├── 📄 package.json           # 프로젝트 설정
├── 📄 tsconfig.json          # TypeScript 설정
├── 📄 jest.config.js         # Jest 테스트 설정
└── 📄 .env                   # 환경변수 (생성 필요)
```

## 🤝 기여하기

### 기여 절차
1. **저장소 포크**: GitHub에서 이 저장소를 포크
2. **개발 환경 설정**: 로컬에 클론 후 의존성 설치
   ```bash
   git clone https://github.com/YOUR_USERNAME/aladin-mcp.git
   cd aladin-mcp
   pnpm install
   ```
3. **브랜치 생성**: 기능별 브랜치 생성
   ```bash
   git checkout -b feature/amazing-feature
   ```
4. **개발 및 테스트**: 코드 작성 후 테스트 실행
   ```bash
   pnpm test
   pnpm lint
   pnpm type-check
   ```
5. **커밋**: Conventional Commits 규칙 준수
   ```bash
   git commit -m "feat: Add amazing feature"
   ```
6. **Pull Request**: GitHub에서 PR 생성

### 코딩 표준
- **언어**: TypeScript 엄격 모드 사용
- **스타일**: Prettier + ESLint 설정 준수
- **커밋**: [Conventional Commits](https://www.conventionalcommits.org/) 규칙
- **테스트**: 새 기능은 반드시 테스트 코드 포함
- **문서**: 공개 API는 JSDoc 주석 필수

### 이슈 보고
버그나 기능 요청은 [GitHub Issues](https://github.com/albertrim/aladin-mcp/issues)를 통해 보고해주세요.

## 📄 라이선스

이 프로젝트는 **MIT 라이선스** 하에 배포됩니다.

```
MIT License

Copyright (c) 2024 Albert Rim

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 🚀 로드맵

### 현재 버전 (v1.0.0)
- ✅ 기본 MCP 도구 6개 구현
- ✅ Claude Desktop 연동
- ✅ 포괄적 테스트 커버리지
- ✅ 완전한 TypeScript 지원

### 향후 계획 (v1.1.0+)
- 🔄 성능 최적화 및 캐싱 시스템
- 🔄 다국어 지원 (영어, 일본어)
- 🔄 고급 검색 필터링 옵션
- 🔄 사용자 맞춤 추천 시스템

## 🙏 감사의 말

- **알라딘**: 풍부한 도서 데이터를 제공하는 OpenAPI
- **Anthropic**: 혁신적인 MCP 프로토콜 및 Claude AI
- **TypeScript 커뮤니티**: 강력한 타입 시스템과 도구들
- **기여자들**: 프로젝트 개선에 참여해주신 모든 분들

## 📞 연락처

- **개발자**: Albert Rim
- **이메일**: albertrim@example.com
- **GitHub**: [@albertrim](https://github.com/albertrim)
- **이슈 트래커**: [GitHub Issues](https://github.com/albertrim/aladin-mcp/issues)

---

**🔍 알라딘 MCP 서버**로 Claude AI에서 한국 도서 정보를 자유롭게 탐색하세요! 📚✨