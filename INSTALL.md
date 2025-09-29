# 알라딘 MCP 서버 설치 가이드

## 📋 사전 요구사항

- Node.js 18.0.0 이상
- pnpm 8.0.0 이상
- Claude Desktop 앱

## 🚀 설치 과정

### 1. 프로젝트 클론 및 설치

```bash
git clone https://github.com/albertrim/aladin-mcp.git
cd aladin-mcp
pnpm install
```

### 2. 환경 설정

```bash
# .env 파일 생성
cp .env.example .env

# TTB_KEY 설정 (알라딘 API 키)
echo "TTB_KEY=your_aladin_api_key_here" >> .env
echo "NODE_ENV=production" >> .env
echo "LOG_LEVEL=info" >> .env
```

### 3. 빌드

```bash
pnpm build:prod
```

### 4. Claude Desktop 설정

#### Windows
Claude Desktop 설정 파일 위치: `%APPDATA%\Claude\claude_desktop_config.json`

#### macOS
Claude Desktop 설정 파일 위치: `~/Library/Application Support/Claude/claude_desktop_config.json`

#### Linux
Claude Desktop 설정 파일 위치: `~/.config/Claude/claude_desktop_config.json`

**설정 내용:**
```json
{
  "mcpServers": {
    "aladin-mcp": {
      "command": "node",
      "args": ["/전체/경로/aladin-mcp/dist/index.js"],
      "env": {
        "TTB_KEY": "your_aladin_api_key_here",
        "NODE_ENV": "production",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

**주의:** `args` 배열의 경로는 프로젝트가 설치된 실제 전체 경로로 변경해야 합니다.

### 5. Claude Desktop 재시작

설정 완료 후 Claude Desktop 앱을 완전히 종료하고 다시 시작합니다.

## 🔧 테스트

Claude Desktop에서 다음 명령어로 MCP 도구가 정상 작동하는지 확인:

```
도서 제목 "파이썬"으로 검색해줘
```

## 📊 사용 가능한 도구

1. **aladin_search**: 도서 검색
   - 키워드, 저자, 출판사로 검색 가능

2. **aladin_book_info**: ISBN으로 상세 정보 조회
   - 도서의 자세한 정보 확인

3. **aladin_bestsellers**: 분야별 베스트셀러 목록
   - 다양한 카테고리의 인기 도서

4. **aladin_new_books**: 신간 도서 목록
   - 최신 출간 도서 정보

## 🔍 문제 해결

### 일반적인 문제

1. **"명령어를 찾을 수 없음" 오류**
   - Node.js가 시스템 PATH에 포함되어 있는지 확인
   - `node --version` 명령어로 Node.js 설치 확인

2. **"TTB_KEY 오류" 메시지**
   - .env 파일의 TTB_KEY 값 확인
   - 알라딘 API 키가 올바른지 확인

3. **Claude Desktop에서 도구가 보이지 않음**
   - claude_desktop_config.json 파일 경로 확인
   - 설정 파일의 JSON 문법 오류 확인
   - Claude Desktop 완전 재시작

### 로그 확인

```bash
# 개발 모드로 실행하여 자세한 로그 확인
NODE_ENV=development LOG_LEVEL=debug node dist/index.js
```

## 📞 지원

문제가 지속되면 GitHub Issues에 보고해주세요:
https://github.com/albertrim/aladin-mcp/issues