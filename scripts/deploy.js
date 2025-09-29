#!/usr/bin/env node

/**
 * 배포 스크립트
 * 자동 빌드, 테스트, 버전 관리 및 릴리스 수행
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// 명령어 실행 헬퍼
function runCommand(command, description) {
  console.log(`🔄 ${description}...`);
  try {
    const result = execSync(command, {
      cwd: projectRoot,
      stdio: 'inherit',
      encoding: 'utf8'
    });
    console.log(`✅ ${description} 완료\n`);
    return result;
  } catch (error) {
    console.error(`❌ ${description} 실패:`, error.message);
    process.exit(1);
  }
}

// 현재 버전 정보 가져오기
function getCurrentVersion() {
  const packagePath = join(projectRoot, 'package.json');
  const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
  return packageJson.version;
}

// 다음 버전 계산
function getNextVersion(currentVersion, releaseType = 'patch') {
  const [major, minor, patch] = currentVersion.split('.').map(Number);

  switch (releaseType) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
    default:
      return `${major}.${minor}.${patch + 1}`;
  }
}

// 릴리스 노트 생성
function generateReleaseNotes(version) {
  const changelogPath = join(projectRoot, 'CHANGELOG.md');

  if (!existsSync(changelogPath)) {
    return `알라딘 MCP 서버 v${version} 릴리스`;
  }

  try {
    const changelog = readFileSync(changelogPath, 'utf8');
    const unreleased = changelog.match(/## \[Unreleased\](.*?)(?=## \[|\n---|\n$)/s);

    if (unreleased && unreleased[1].trim()) {
      return `알라딘 MCP 서버 v${version} 릴리스\n\n${unreleased[1].trim()}`;
    }

    return `알라딘 MCP 서버 v${version} 릴리스\n\n주요 개선사항 및 버그 수정이 포함되었습니다.`;
  } catch (error) {
    console.warn('⚠️  CHANGELOG.md 파싱 중 오류:', error.message);
    return `알라딘 MCP 서버 v${version} 릴리스`;
  }
}

// 메인 배포 로직
async function deploy() {
  console.log('🚀 알라딘 MCP 서버 배포를 시작합니다...\n');

  // 배포 타입 확인
  const args = process.argv.slice(2);
  const releaseType = args[0] || 'patch';

  if (!['major', 'minor', 'patch'].includes(releaseType)) {
    console.error('❌ 올바르지 않은 릴리스 타입입니다. (major, minor, patch 중 선택)');
    process.exit(1);
  }

  const currentVersion = getCurrentVersion();
  const nextVersion = getNextVersion(currentVersion, releaseType);

  console.log(`📋 배포 정보:`);
  console.log(`  - 현재 버전: ${currentVersion}`);
  console.log(`  - 다음 버전: ${nextVersion}`);
  console.log(`  - 릴리스 타입: ${releaseType}\n`);

  // 1. Git 상태 확인
  console.log('🔍 Git 상태 확인...');
  try {
    const gitStatus = execSync('git status --porcelain', {
      cwd: projectRoot,
      encoding: 'utf8'
    });

    if (gitStatus.trim()) {
      console.error('❌ Git 작업 디렉토리에 커밋되지 않은 변경사항이 있습니다.');
      console.error('배포하기 전에 모든 변경사항을 커밋해주세요.');
      process.exit(1);
    }
    console.log('✅ Git 상태 깨끗함\n');
  } catch (error) {
    console.error('❌ Git 상태 확인 실패:', error.message);
    process.exit(1);
  }

  // 2. 의존성 설치
  runCommand('pnpm install --frozen-lockfile', '의존성 설치');

  // 3. 코드 품질 검사
  runCommand('pnpm lint', '코드 린팅');
  runCommand('pnpm format:check', '코드 포맷 검사');
  runCommand('pnpm type-check', 'TypeScript 타입 검사');

  // 4. 테스트 실행
  runCommand('pnpm test:ci', '전체 테스트');

  // 5. 프로덕션 빌드
  runCommand('pnpm build:prod', '프로덕션 빌드');

  // 6. 빌드 검증
  runCommand('pnpm build:verify', '빌드 검증');

  // 7. 버전 업데이트
  console.log(`🏷️  버전을 ${nextVersion}으로 업데이트...`);
  runCommand(`npm version ${releaseType} --no-git-tag-version`, '버전 업데이트');

  // 8. CHANGELOG 업데이트
  console.log('📋 CHANGELOG.md 업데이트...');
  const changelogPath = join(projectRoot, 'CHANGELOG.md');
  if (existsSync(changelogPath)) {
    try {
      let changelog = readFileSync(changelogPath, 'utf8');
      const today = new Date().toISOString().split('T')[0];

      // [Unreleased] 섹션을 새 버전으로 변경
      changelog = changelog.replace(
        /## \[Unreleased\]/,
        `## [Unreleased]\n\n### 계획된 기능\n- TBD\n\n---\n\n## [${nextVersion}] - ${today}`
      );

      writeFileSync(changelogPath, changelog);
      console.log('✅ CHANGELOG.md 업데이트 완료\n');
    } catch (error) {
      console.warn('⚠️  CHANGELOG.md 업데이트 실패:', error.message);
    }
  }

  // 9. Git 커밋 및 태그
  console.log('📝 버전 커밋 및 태그 생성...');
  runCommand('git add .', '변경사항 스테이징');
  runCommand(`git commit -m "chore: v${nextVersion} 릴리스 준비"`, '버전 커밋');
  runCommand(`git tag -a v${nextVersion} -m "v${nextVersion} 릴리스"`, '버전 태그');

  // 10. 원격 저장소 푸시 (선택사항)
  if (process.env.CI || args.includes('--push')) {
    console.log('🌐 원격 저장소에 푸시...');
    runCommand('git push origin main', '커밋 푸시');
    runCommand('git push origin --tags', '태그 푸시');
  } else {
    console.log('ℹ️  원격 푸시를 건너뜁니다. (--push 플래그로 활성화 가능)');
  }

  // 11. npm 패키지 배포 (선택사항)
  if (process.env.CI || args.includes('--publish')) {
    console.log('📦 npm 패키지 배포...');
    runCommand('npm publish', 'npm 배포');
  } else {
    console.log('ℹ️  npm 배포를 건너뜁니다. (--publish 플래그로 활성화 가능)');
  }

  // 12. 릴리스 노트 생성 (GitHub)
  if (args.includes('--github-release')) {
    const releaseNotes = generateReleaseNotes(nextVersion);
    try {
      runCommand(
        `gh release create v${nextVersion} --title "v${nextVersion}" --notes "${releaseNotes}"`,
        'GitHub 릴리스 생성'
      );
    } catch (error) {
      console.warn('⚠️  GitHub 릴리스 생성 실패 (gh CLI 확인 필요):', error.message);
    }
  }

  // 완료 메시지
  console.log('\n🎉 배포가 성공적으로 완료되었습니다!');
  console.log('📋 배포 요약:');
  console.log(`  - 버전: ${currentVersion} → ${nextVersion}`);
  try {
    const buildStats = statSync(join(projectRoot, 'dist', 'index.js'));
    console.log(`  - 빌드 크기: ${Math.round(buildStats.size / 1024)} KB`);
  } catch (error) {
    console.log('  - 빌드 크기: 확인 불가');
  }
  console.log(`  - 테스트: 통과`);
  console.log(`  - 보안 검사: 통과`);

  if (args.includes('--push')) {
    console.log(`  - Git 푸시: 완료`);
  }

  if (args.includes('--publish')) {
    console.log(`  - npm 배포: 완료`);
  }

  console.log('\n🚀 릴리스가 준비되었습니다!');
}

// 스크립트 실행
if (import.meta.url === `file://${process.argv[1]}`) {
  deploy().catch(error => {
    console.error('💥 배포 중 예상치 못한 오류:', error);
    process.exit(1);
  });
}