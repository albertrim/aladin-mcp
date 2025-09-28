# Claude Desktop 연동 가이드

알라딘 MCP 서버를 Claude Desktop에서 사용하는 방법을 안내합니다.

## 📋 사전 준비사항

1. **Node.js 18.0.0 이상** 설치 확인
2. **pnpm** 패키지 매니저 설치
3. **Claude Desktop** 앱 설치 (https://claude.ai/download)
4. **알라딘 TTB 키** 준비 (`ttbalbert.rim1712001`)

## 🚀 단계별 설정

### 1. 프로젝트 빌드

```bash
cd C:\Users\alber\Projects\aladin-mcp
pnpm install
pnpm build
```

### 2. 환경변수 설정

`.env` 파일을 생성하고 다음 내용을 설정:

```env
TTB_KEY=ttbalbert.rim1712001
NODE_ENV=development
LOG_LEVEL=info
```

### 3. Claude Desktop 설정

Claude Desktop의 설정 파일에 다음 내용을 추가합니다:

**Windows 설정 파일 위치**: `%APPDATA%\Claude\claude_desktop_config.json`
**macOS 설정 파일 위치**: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "aladin-mcp": {
      "command": "node",
      "args": [
        "dist/index.js"
      ],
      "cwd": "C:\\Users\\alber\\Projects\\aladin-mcp",
      "env": {
        "TTB_KEY": "ttbalbert.rim1712001",
        "NODE_ENV": "development",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

**주요 설정 설명**:
- `command`: Node.js 실행 명령어
- `args`: 실행할 JavaScript 파일 (상대 경로)
- `cwd`: 작업 디렉토리 (절대 경로, 백슬래시 `\\` 이스케이프 필요)
- `env`: 환경변수 (TTB_KEY, NODE_ENV, LOG_LEVEL)

### 4. Claude Desktop 재시작

설정 파일을 수정한 후 Claude Desktop을 완전히 종료하고 다시 시작합니다.

## 🧪 테스트 방법

Claude Desktop에서 다음 명령어들을 시도해보세요:

### 도서 검색 테스트
```
알라딘에서 "프로그래밍" 관련 도서를 검색해주세요.
```

### 베스트셀러 조회 테스트
```
IT/프로그래밍 분야의 베스트셀러를 알려주세요.
```

### 특정 도서 정보 조회
```
ISBN 9788966262267 도서의 상세 정보를 알려주세요.
```

### 신간 도서 조회
```
최근 출간된 컴퓨터/IT 신간 도서 목록을 보여주세요.
```

## 🔧 사용 가능한 MCP 도구

1. **aladin_search**: 키워드로 도서 검색
2. **aladin_book_info**: ISBN으로 상세 정보 조회
3. **aladin_bestsellers**: 분야별 베스트셀러 목록
4. **aladin_new_books**: 신간 도서 목록
5. **aladin_item_list**: 추천/편집자 선택 목록
6. **aladin_categories**: 카테고리 정보 조회

## 🐛 문제 해결

### 연결 실패 시
1. **경로 확인**: `dist/index.js` 파일이 존재하는지 확인
2. **권한 확인**: Node.js 실행 권한 확인
3. **포트 충돌**: 다른 프로세스가 포트를 사용하고 있는지 확인

### 로그 확인
서버 실행 로그를 확인하려면:

```bash
# 개발 모드로 실행 (상세 로그)
cd C:\Users\alber\Projects\aladin-mcp
pnpm dev
```

### API 키 오류 시
1. TTB_KEY가 올바른지 확인
2. 알라딘 API 일일 호출 한도(5,000회) 확인
3. 네트워크 연결 상태 확인

## 📊 API 사용량 확인

MCP 도구를 사용할 때마다 API 호출 횟수가 증가합니다. 일일 5,000회 제한을 준수하세요.

## 🔒 보안 주의사항

- TTB_KEY는 개인 정보이므로 외부에 노출하지 마세요
- .env 파일은 Git에 커밋하지 마세요
- 프로덕션 환경에서는 LOG_LEVEL을 'error'로 설정하세요