# 백업 및 복구 절차

## 📋 개요

알라딘 MCP 서버의 데이터 백업, 복구 및 재해 복구 절차를 문서화합니다.

## 🗂️ 백업 대상

### 1. 핵심 데이터
- **설정 파일**: `.env`, `claude-desktop-config.json`
- **로그 파일**: `logs/` 디렉토리 전체
- **카테고리 데이터**: `data/categories.csv`
- **소스 코드**: `src/` 디렉토리 (Git 백업)

### 2. 시스템 설정
- **패키지 설정**: `package.json`, `pnpm-lock.yaml`
- **TypeScript 설정**: `tsconfig.json`, `tsconfig.prod.json`
- **빌드 출력**: `dist/` 디렉토리

### 3. 운영 데이터
- **모니터링 상태**: `logs/monitor-status.json`
- **알림 로그**: `logs/alerts.log`
- **API 사용 통계**: 로그 파일 내 API 호출 기록

## 💾 백업 전략

### 자동 백업 스케줄
- **일일 백업**: 로그 파일 및 설정 파일
- **주간 백업**: 전체 프로젝트 아카이브
- **월간 백업**: 장기 보관용 전체 백업

### 백업 보관 정책
- **로컬 백업**: 최근 7일간 일일 백업
- **원격 백업**: 최근 4주간 주간 백업
- **장기 보관**: 분기별 백업 (1년간)

## 🔧 백업 스크립트

### 일일 백업 스크립트

```bash
#!/bin/bash
# scripts/backup-daily.sh

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="${PROJECT_ROOT}/backups/daily"
DATE=$(date +%Y%m%d)

# 백업 디렉토리 생성
mkdir -p "${BACKUP_DIR}"

# 설정 파일 백업
echo "📁 설정 파일 백업 중..."
tar -czf "${BACKUP_DIR}/config_${DATE}.tar.gz" \
  .env \
  claude-desktop-config.json \
  package.json \
  pnpm-lock.yaml \
  tsconfig*.json

# 로그 파일 백업
echo "📋 로그 파일 백업 중..."
if [ -d "logs" ]; then
  tar -czf "${BACKUP_DIR}/logs_${DATE}.tar.gz" logs/
fi

# 카테고리 데이터 백업
echo "📊 데이터 파일 백업 중..."
if [ -d "data" ]; then
  tar -czf "${BACKUP_DIR}/data_${DATE}.tar.gz" data/
fi

# 오래된 백업 정리 (7일 이상)
echo "🧹 오래된 백업 정리 중..."
find "${BACKUP_DIR}" -name "*.tar.gz" -mtime +7 -delete

echo "✅ 일일 백업 완료: ${BACKUP_DIR}"
```

### 주간 백업 스크립트

```bash
#!/bin/bash
# scripts/backup-weekly.sh

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="${PROJECT_ROOT}/backups/weekly"
DATE=$(date +%Y%m%d)

mkdir -p "${BACKUP_DIR}"

echo "📦 전체 프로젝트 백업 중..."

# Git 상태 확인
if [ -d ".git" ]; then
  echo "🔄 Git 상태 기록 중..."
  git status > git-status.txt
  git log --oneline -10 > git-recent-commits.txt
fi

# 전체 프로젝트 아카이브 (node_modules 제외)
tar -czf "${BACKUP_DIR}/aladin-mcp-full_${DATE}.tar.gz" \
  --exclude=node_modules \
  --exclude=.git \
  --exclude=dist \
  --exclude=backups \
  --exclude=.jest-cache \
  .

# Git 임시 파일 정리
rm -f git-status.txt git-recent-commits.txt

# 오래된 백업 정리 (28일 이상)
find "${BACKUP_DIR}" -name "*.tar.gz" -mtime +28 -delete

echo "✅ 주간 백업 완료: ${BACKUP_DIR}"
```

## 🔄 복구 절차

### 1. 긴급 복구 (설정 파일)

```bash
# 1. 최신 설정 백업 찾기
cd backups/daily
ls -la config_*.tar.gz | tail -1

# 2. 설정 파일 복구
tar -xzf config_YYYYMMDD.tar.gz

# 3. 환경 설정 확인
cat .env
```

### 2. 데이터 복구

```bash
# 1. 로그 파일 복구
tar -xzf logs_YYYYMMDD.tar.gz

# 2. 카테고리 데이터 복구
tar -xzf data_YYYYMMDD.tar.gz

# 3. 권한 설정
chmod -R 644 logs/
chmod -R 644 data/
```

### 3. 전체 시스템 복구

```bash
# 1. 프로젝트 디렉토리 생성
mkdir -p /path/to/recovery/aladin-mcp
cd /path/to/recovery/aladin-mcp

# 2. 백업 파일 복구
tar -xzf /path/to/backup/aladin-mcp-full_YYYYMMDD.tar.gz

# 3. 의존성 설치
pnpm install

# 4. 빌드
pnpm build:prod

# 5. 서비스 시작
pnpm start
```

## 🚨 재해 복구 시나리오

### 시나리오 1: 설정 파일 손실

**증상**: 환경 변수 오류, API 키 인식 실패

**복구 단계**:
1. 최신 설정 백업 확인
2. `.env` 파일 복구
3. `claude-desktop-config.json` 복구
4. 서비스 재시작
5. 기능 테스트

**예상 복구 시간**: 5-10분

### 시나리오 2: 로그 데이터 손실

**증상**: 모니터링 데이터 누락, 사용 통계 초기화

**복구 단계**:
1. 로그 백업 확인
2. `logs/` 디렉토리 복구
3. 모니터링 서비스 재시작
4. 알림 기능 테스트

**예상 복구 시간**: 10-15분

### 시나리오 3: 전체 시스템 장애

**증상**: 서버 실행 불가, 파일 시스템 손상

**복구 단계**:
1. 새로운 서버 환경 준비
2. 최신 전체 백업 복구
3. 의존성 재설치
4. 환경 설정 검증
5. 전체 시스템 테스트

**예상 복구 시간**: 30-60분

## 📊 백업 모니터링

### 백업 상태 확인

```bash
# 백업 현황 확인 스크립트
# scripts/check-backups.sh

echo "📊 백업 현황 확인"
echo "===================="

# 일일 백업 확인
if [ -d "backups/daily" ]; then
  echo "📅 일일 백업:"
  ls -la backups/daily/ | tail -5
else
  echo "⚠️ 일일 백업 디렉토리 없음"
fi

# 주간 백업 확인
if [ -d "backups/weekly" ]; then
  echo -e "\n📆 주간 백업:"
  ls -la backups/weekly/ | tail -5
else
  echo "⚠️ 주간 백업 디렉토리 없음"
fi

# 백업 크기 확인
echo -e "\n💾 백업 크기:"
du -sh backups/ 2>/dev/null || echo "백업 디렉토리 없음"
```

### 백업 무결성 검증

```bash
# 백업 파일 무결성 확인
# scripts/verify-backups.sh

for backup in backups/daily/*.tar.gz; do
  if [ -f "$backup" ]; then
    echo "🔍 검증 중: $(basename $backup)"
    if tar -tzf "$backup" >/dev/null 2>&1; then
      echo "✅ 정상"
    else
      echo "❌ 손상됨"
    fi
  fi
done
```

## 🔐 보안 고려사항

### 백업 암호화

```bash
# 민감한 데이터 백업시 GPG 암호화 사용
gpg --symmetric --cipher-algo AES256 backup_file.tar.gz
```

### 접근 권한 관리

```bash
# 백업 파일 권한 설정
chmod 600 backups/daily/*.tar.gz
chmod 600 backups/weekly/*.tar.gz

# 백업 디렉토리 권한
chmod 700 backups/
```

## 📝 복구 체크리스트

### 복구 후 검증 항목

- [ ] 환경 변수 설정 확인
- [ ] API 키 유효성 검증
- [ ] 네트워크 연결 테스트
- [ ] 로그 파일 생성 확인
- [ ] 모니터링 서비스 정상 작동
- [ ] MCP 도구 기능 테스트
- [ ] Claude Desktop 연결 확인
- [ ] 성능 지표 정상 범위 확인

### 복구 후 보고서 템플릿

```
복구 보고서
===========

일시: YYYY-MM-DD HH:MM:SS
담당자: [이름]

1. 장애 상황
   - 발생 시간:
   - 원인:
   - 영향 범위:

2. 복구 절차
   - 사용된 백업:
   - 복구 단계:
   - 소요 시간:

3. 검증 결과
   - 기능 테스트: [통과/실패]
   - 성능 확인: [정상/이상]
   - 데이터 무결성: [확인/문제]

4. 향후 조치
   - 재발 방지책:
   - 프로세스 개선:
```

## 📞 비상 연락처

- **시스템 관리자**: albertrim@example.com
- **기술 지원**: GitHub Issues
- **알라딘 API 지원**: 알라딘 개발자 센터

---

**중요**: 이 문서는 정기적으로 업데이트되어야 하며, 복구 절차는 정기적으로 테스트하여 유효성을 검증해야 합니다.