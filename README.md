# 알라딘 OpenAPI MCP 서버

> 알라딘 OpenAPI를 활용한 도서 정보 조회 MCP(Model Context Protocol) 서버

## 🚀 프로젝트 개요

이 프로젝트는 알라딘 OpenAPI를 통해 도서 검색, 상세 정보 조회, 베스트셀러 및 신간 목록 등의 기능을 제공하는 MCP 서버입니다. Claude Desktop과 연동하여 사용할 수 있습니다.

## 🎯 주요 기능

- **도서 검색**: 키워드, 저자, 출판사 등으로 도서 검색
- **상세 정보**: ISBN으로 도서 상세 정보 조회
- **베스트셀러**: 분야별 베스트셀러 목록 조회
- **신간 도서**: 최신 출간 도서 목록 조회
- **카테고리**: 도서 분야 및 카테고리 정보 제공

## 📋 요구사항

- Node.js v18.0.0 이상
- TypeScript v5.0.0 이상
- pnpm v8.0.0 이상
- 알라딘 TTB 키 (API 키)

## 🛠️ 설치 및 설정

### 1. 저장소 클론
```bash
git clone https://github.com/YOUR_USERNAME/aladin-mcp.git
cd aladin-mcp
```

### 2. 의존성 설치
```bash
pnpm install
```

### 3. 환경변수 설정
```bash
cp .env.example .env
# .env 파일에 알라딘 TTB 키 설정
```

### 4. 개발 서버 실행
```bash
pnpm dev
```

## 🔧 MCP 도구

이 서버는 다음 6가지 MCP 도구를 제공합니다:

1. **aladin_search** - 도서 검색
2. **aladin_book_info** - 도서 상세 정보 조회
3. **aladin_bestsellers** - 베스트셀러 목록
4. **aladin_new_books** - 신간 도서 목록
5. **aladin_item_list** - 추천/편집자 선택 목록
6. **aladin_categories** - 카테고리 정보

## 📚 사용법

### Claude Desktop 연동

1. Claude Desktop 설정 파일에 다음 내용 추가:
```json
{
  "mcpServers": {
    "aladin-mcp": {
      "command": "node",
      "args": ["path/to/aladin-mcp/dist/index.js"],
      "env": {
        "TTB_KEY": "your_aladin_api_key"
      }
    }
  }
}
```

2. Claude Desktop 재시작

### API 사용 예제

```javascript
// 도서 검색
await searchBooks("해리포터", "Title", "Book");

// 도서 상세 정보
await getBookDetails("9788983920720");

// 베스트셀러 목록
await getBestsellerList("100"); // 소설 분야
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
```

## 📖 개발 문서

- [개발 계획서](./PLAN.md)
- [실행 계획서](./EXECUTION.md)
- [개발 지침](./CLAUDE.md)

## 🤝 기여하기

1. 이 저장소를 포크합니다
2. 기능 브랜치를 생성합니다 (`git checkout -b feature/AmazingFeature`)
3. 변경사항을 커밋합니다 (`git commit -m 'feat: Add some AmazingFeature'`)
4. 브랜치에 푸시합니다 (`git push origin feature/AmazingFeature`)
5. Pull Request를 생성합니다

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 🔗 관련 링크

- [알라딘 OpenAPI 문서](http://blog.aladin.co.kr/openapi)
- [MCP 프로토콜 명세](https://modelcontextprotocol.io)
- [Claude Desktop](https://claude.ai/desktop)

## 📞 문의

프로젝트에 대한 질문이나 제안이 있으시면 GitHub Issues를 통해 연락주세요.