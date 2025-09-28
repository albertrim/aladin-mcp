# 🤝 기여 가이드

알라딘 MCP 서버 프로젝트에 기여해주셔서 감사합니다! 이 문서는 효과적인 기여를 위한 가이드라인을 제공합니다.

## 📋 목차

1. [시작하기](#시작하기)
2. [개발 환경 설정](#개발-환경-설정)
3. [코딩 표준](#코딩-표준)
4. [커밋 규칙](#커밋-규칙)
5. [Pull Request 가이드](#pull-request-가이드)
6. [이슈 보고](#이슈-보고)
7. [코드 리뷰](#코드-리뷰)

## 🚀 시작하기

### 기여 방법

1. **버그 수정**: 발견한 버그를 수정하고 테스트 추가
2. **새 기능**: 새로운 MCP 도구나 유틸리티 추가
3. **문서 개선**: README, API 문서, 주석 개선
4. **테스트 추가**: 테스트 커버리지 향상
5. **성능 개선**: 최적화 및 성능 향상

### 기여 절차

```bash
# 1. 저장소 포크 (GitHub 웹에서)
# 2. 로컬에 클론
git clone https://github.com/YOUR_USERNAME/aladin-mcp.git
cd aladin-mcp

# 3. 업스트림 원격 저장소 추가
git remote add upstream https://github.com/albertrim/aladin-mcp.git

# 4. 의존성 설치
pnpm install

# 5. 새 브랜치 생성
git checkout -b feature/your-feature-name

# 6. 개발 및 테스트
# ... 코드 작성 ...

# 7. 테스트 실행
pnpm test
pnpm lint
pnpm type-check

# 8. 커밋
git add .
git commit -m "feat: Add your feature"

# 9. 푸시
git push origin feature/your-feature-name

# 10. Pull Request 생성 (GitHub 웹에서)
```

## 🛠️ 개발 환경 설정

### 필수 요구사항

- **Node.js**: v18.0.0 이상
- **pnpm**: v8.0.0 이상
- **Git**: 최신 버전
- **VS Code**: 권장 에디터

### 권장 VS Code 확장

```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-json"
  ]
}
```

### 환경 설정

```bash
# 환경변수 파일 생성
cp .env.example .env

# TTB 키 설정 (개발용)
echo "TTB_KEY=your_dev_api_key" >> .env
echo "NODE_ENV=development" >> .env
echo "LOG_LEVEL=debug" >> .env
```

### 개발 서버 실행

```bash
# 개발 모드 (Hot Reload)
pnpm dev

# 프로덕션 빌드 테스트
pnpm build
pnpm start

# 테스트 실행
pnpm test:watch
```

## 📐 코딩 표준

### TypeScript 규칙

```typescript
// ✅ 좋은 예
interface BookSearchParams {
  readonly query: string;
  readonly queryType?: SearchQueryType;
  readonly maxResults?: number;
}

const searchBooks = async (params: BookSearchParams): Promise<SearchResult> => {
  // 구현
};

// ❌ 나쁜 예
function searchBooks(q: any, type?: any): any {
  // 구현
}
```

### 네이밍 규칙

#### 파일명
- **케밥 케이스**: `rate-limiter.ts`, `error-handler.ts`
- **명확한 이름**: 기능을 명확히 표현

#### 변수/함수명
- **카멜 케이스**: `searchBooks`, `validateIsbn`
- **동사로 시작**: 함수는 동작을 나타내는 동사 사용
- **명확한 의미**: 축약보다는 명확한 이름 선호

#### 타입/인터페이스명
- **파스칼 케이스**: `BookItem`, `SearchResult`
- **접미사 사용**: Interface는 생략, Type은 `Type` 접미사

#### 상수명
- **스크리밍 스네이크 케이스**: `API_BASE_URL`, `DEFAULT_PAGE_SIZE`

### 코드 구조

```typescript
// 1. 외부 라이브러리 import
import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';

// 2. 내부 모듈 import
import { AladinApiClient } from './client.js';
import { validateSearchParams } from './utils/validators.js';

// 3. 타입 정의
import type { SearchParams, SearchResult } from './types.js';

// 4. 상수 정의
const DEFAULT_PAGE_SIZE = 10;

// 5. 함수 구현
export const searchBooks = async (params: SearchParams): Promise<SearchResult> => {
  // 구현
};
```

### JSDoc 주석

```typescript
/**
 * 알라딘 API를 통해 도서를 검색합니다.
 *
 * @param params - 검색 파라미터
 * @param params.query - 검색 키워드
 * @param params.queryType - 검색 유형 (기본: "Title")
 * @returns 검색 결과를 포함하는 Promise
 *
 * @example
 * ```typescript
 * const result = await searchBooks({
 *   query: "프로그래밍",
 *   queryType: "Title",
 *   maxResults: 20
 * });
 * ```
 *
 * @throws {AladinApiError} API 호출 실패 시
 */
export const searchBooks = async (params: SearchParams): Promise<SearchResult> => {
  // 구현
};
```

## 📝 커밋 규칙

### Conventional Commits

```bash
# 형식
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### 커밋 타입

- **feat**: 새로운 기능 추가
- **fix**: 버그 수정
- **docs**: 문서 수정
- **style**: 코드 스타일 변경 (포맷팅, 세미콜론 등)
- **refactor**: 코드 리팩토링
- **test**: 테스트 추가/수정
- **chore**: 빌드 프로세스, 보조 도구 변경
- **perf**: 성능 개선
- **ci**: CI 설정 변경

### 커밋 예시

```bash
# 기능 추가
feat: Add aladin_categories MCP tool

# 버그 수정
fix: Handle network timeout in API client

# 문서 수정
docs: Update API documentation with examples

# 리팩토링
refactor: Extract validation logic to separate module

# 테스트 추가
test: Add unit tests for ISBN validation

# 성능 개선
perf: Implement response caching for repeated queries
```

### 커밋 메시지 가이드라인

- **첫 줄은 50자 이내**
- **명령문 형태 사용**: "Add" not "Added"
- **본문은 72자에서 줄바꿈**
- **What과 Why 설명**, How는 코드에서 확인

## 🔄 Pull Request 가이드

### PR 체크리스트

- [ ] **브랜치명이 올바른가?** (`feature/`, `fix/`, `docs/` 등)
- [ ] **커밋 메시지가 규칙을 따르는가?**
- [ ] **모든 테스트가 통과하는가?**
- [ ] **린트 검사가 통과하는가?**
- [ ] **타입 체크가 통과하는가?**
- [ ] **관련 문서가 업데이트되었는가?**
- [ ] **Breaking Changes가 있으면 명시했는가?**

### PR 템플릿

```markdown
## 📋 변경 사항

### 변경 유형
- [ ] 🆕 새 기능
- [ ] 🐛 버그 수정
- [ ] 📚 문서 업데이트
- [ ] 🔧 리팩토링
- [ ] ⚡ 성능 개선
- [ ] 🧪 테스트 추가

### 설명
<!-- 이 PR이 무엇을 하는지 간단히 설명하세요 -->

### 관련 이슈
<!-- 관련된 이슈 번호를 링크하세요 -->
- Closes #이슈번호
- Related to #이슈번호

## 🧪 테스트

### 테스트 방법
<!-- 이 변경사항을 어떻게 테스트했는지 설명하세요 -->

### 테스트 결과
- [ ] 모든 기존 테스트 통과
- [ ] 새로운 테스트 추가 및 통과
- [ ] 수동 테스트 완료

## 📸 스크린샷 (해당하는 경우)
<!-- UI 변경이 있다면 스크린샷을 첨부하세요 -->

## 🔄 Breaking Changes
<!-- Breaking Changes가 있다면 설명하세요 -->

## 📝 추가 정보
<!-- 리뷰어가 알아야 할 추가 정보가 있다면 작성하세요 -->
```

### PR 크기 가이드라인

- **Small PR (< 200 lines)**: 빠른 리뷰 가능
- **Medium PR (200-500 lines)**: 적절한 크기
- **Large PR (> 500 lines)**: 분할 고려

## 🐛 이슈 보고

### 버그 리포트 템플릿

```markdown
## 🐛 버그 설명
<!-- 간단하고 명확한 버그 설명 -->

## 🔄 재현 단계
1. '...'으로 이동
2. '....'를 클릭
3. '....'까지 스크롤
4. 에러 발생

## 🎯 예상 동작
<!-- 발생해야 할 동작 설명 -->

## 💥 실제 동작
<!-- 실제 발생한 동작 설명 -->

## 🖥️ 환경 정보
- OS: [예: Windows 10, macOS 13.0]
- Node.js: [예: v18.17.0]
- 서버 버전: [예: v1.0.0]
- Claude Desktop 버전: [예: v1.2.3]

## 📋 추가 정보
<!-- 로그, 스크린샷 등 추가 정보 -->

### 로그
```
에러 로그를 여기에 붙여넣기
```

### 설정 파일
```json
{
  "관련 설정 파일 내용"
}
```
```

### 기능 요청 템플릿

```markdown
## 🚀 기능 설명
<!-- 새로운 기능에 대한 간단한 설명 -->

## 💡 동기
<!-- 이 기능이 왜 필요한지 설명 -->

## 📋 상세 설명
<!-- 기능의 상세한 동작 방식 -->

## 🎨 모킹/와이어프레임
<!-- UI 변경이 있다면 모킹이나 와이어프레임 첨부 -->

## 🔄 대안
<!-- 고려한 다른 대안들 -->

## 📊 우선순위
- [ ] Critical (즉시 필요)
- [ ] High (다음 릴리스)
- [ ] Medium (향후 계획)
- [ ] Low (선택사항)
```

## 👀 코드 리뷰

### 리뷰어 가이드라인

#### 기능성 검토
- [ ] 요구사항이 완전히 구현되었는가?
- [ ] 에지 케이스가 처리되었는가?
- [ ] 에러 처리가 적절한가?
- [ ] 성능에 부정적 영향이 없는가?

#### 코드 품질 검토
- [ ] 코드가 읽기 쉽고 이해하기 쉬운가?
- [ ] 변수명과 함수명이 명확한가?
- [ ] 중복 코드가 없는가?
- [ ] 적절한 추상화가 이루어졌는가?

#### 보안 검토
- [ ] 입력값 검증이 적절한가?
- [ ] 민감 정보가 노출되지 않는가?
- [ ] SQL Injection 등 보안 취약점이 없는가?

#### 테스트 검토
- [ ] 충분한 테스트 커버리지가 있는가?
- [ ] 테스트가 의미 있는가?
- [ ] 모킹이 적절하게 사용되었는가?

### 리뷰 코멘트 가이드라인

#### 건설적인 피드백
```markdown
# ✅ 좋은 예
이 함수는 너무 많은 책임을 가지고 있습니다.
검증 로직을 별도 함수로 분리하는 것이 어떨까요?

# ❌ 나쁜 예
이 코드는 잘못되었습니다.
```

#### 제안 형태
```markdown
# ✅ 좋은 예
**제안**: `Promise.all()`을 사용하면 병렬 처리로 성능을 개선할 수 있습니다.

```typescript
// 현재
const results = [];
for (const item of items) {
  results.push(await processItem(item));
}

// 제안
const results = await Promise.all(items.map(processItem));
```

#### 중요도 표시
- **🔴 Critical**: 반드시 수정 필요
- **🟡 Suggestion**: 개선 제안
- **🔵 Question**: 질문이나 논의 필요
- **🟢 Praise**: 좋은 코드에 대한 칭찬

## 🏷️ 라벨 시스템

### GitHub Issues 라벨

#### 타입
- `bug`: 버그 보고
- `enhancement`: 기능 개선
- `feature`: 새 기능 요청
- `documentation`: 문서 관련
- `question`: 질문

#### 우선순위
- `priority: critical`: 즉시 수정 필요
- `priority: high`: 높은 우선순위
- `priority: medium`: 보통 우선순위
- `priority: low`: 낮은 우선순위

#### 상태
- `status: needs-review`: 리뷰 필요
- `status: in-progress`: 진행 중
- `status: blocked`: 차단됨
- `status: ready`: 준비 완료

#### 영역
- `area: api`: API 관련
- `area: mcp`: MCP 프로토콜 관련
- `area: testing`: 테스트 관련
- `area: performance`: 성능 관련
- `area: security`: 보안 관련

## 🎉 인정과 보상

### 기여자 인정
- **README.md**에 기여자 목록 추가
- **CHANGELOG.md**에 기여 내용 명시
- **GitHub 프로필**에 기여 배지 표시

### 기여 수준
- **🌟 Core Contributor**: 지속적이고 중요한 기여
- **💎 Major Contributor**: 주요 기능 구현
- **🔧 Bug Hunter**: 중요한 버그 발견 및 수정
- **📚 Documentation**: 문서화 개선
- **🧪 Testing**: 테스트 커버리지 향상

## 📞 문의

기여와 관련하여 질문이 있으시면:

- **GitHub Issues**: 일반적인 질문
- **GitHub Discussions**: 아이디어나 제안 논의
- **이메일**: albertrim@example.com (긴급한 사안)

---

여러분의 기여가 알라딘 MCP 서버를 더욱 훌륭하게 만듭니다! 🚀