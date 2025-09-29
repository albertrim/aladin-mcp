#!/usr/bin/env node

/**
 * 빌드 검증 스크립트
 * 빌드된 파일들의 무결성과 기본 기능을 검증합니다.
 */

import { readFileSync, existsSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');
const distDir = join(projectRoot, 'dist');

console.log('🔍 빌드 검증을 시작합니다...\n');

// 필수 파일들 존재 확인
const requiredFiles = [
  'index.js',
  'client.js',
  'types.js',
  'tools/aladin_search.js',
  'tools/aladin_book_info.js',
  'tools/aladin_bestsellers.js',
  'tools/aladin_new_books.js',
  'tools/aladin_item_list.js',
  'tools/aladin_categories.js',
  'utils/validators.js',
  'utils/formatters.js',
  'utils/logger.js',
  'utils/rate-limiter.js',
  'utils/error-handler.js',
  'constants/api.js',
  'constants/categories.js'
];

console.log('📁 필수 파일 존재 확인...');
let missingFiles = [];

for (const file of requiredFiles) {
  const filePath = join(distDir, file);
  if (!existsSync(filePath)) {
    missingFiles.push(file);
    console.log(`❌ 누락: ${file}`);
  } else {
    console.log(`✅ 확인: ${file}`);
  }
}

if (missingFiles.length > 0) {
  console.error(`\n❌ ${missingFiles.length}개의 필수 파일이 누락되었습니다.`);
  process.exit(1);
}

// 빌드된 파일 크기 확인
console.log('\n📏 파일 크기 확인...');
const mainFile = join(distDir, 'index.js');
const stats = statSync(mainFile);
const fileSizeKB = Math.round(stats.size / 1024);

console.log(`📄 index.js: ${fileSizeKB} KB`);

if (fileSizeKB < 1) {
  console.error('❌ 메인 파일이 너무 작습니다. 빌드에 문제가 있을 수 있습니다.');
  process.exit(1);
}

if (fileSizeKB > 1000) {
  console.warn('⚠️  메인 파일이 1MB를 초과합니다. 번들 크기를 확인해보세요.');
}

// JavaScript 구문 검사
console.log('\n🔬 구문 검사...');
try {
  const mainContent = readFileSync(mainFile, 'utf8');

  // ES Module 확인
  if (!mainContent.includes('import') && !mainContent.includes('export')) {
    console.warn('⚠️  ES Module import/export가 감지되지 않았습니다.');
  }

  // MCP 관련 코드 확인
  if (!mainContent.includes('@modelcontextprotocol')) {
    console.error('❌ MCP SDK import가 감지되지 않았습니다.');
    process.exit(1);
  }

  console.log('✅ 구문 검사 통과');
} catch (error) {
  console.error('❌ 구문 검사 실패:', error.message);
  process.exit(1);
}

// 패키지.json 일관성 확인
console.log('\n📦 package.json 일관성 확인...');
try {
  const packageJson = JSON.parse(readFileSync(join(projectRoot, 'package.json'), 'utf8'));

  // 필수 필드 확인
  const requiredFields = ['name', 'version', 'description', 'main', 'type'];
  for (const field of requiredFields) {
    if (!packageJson[field]) {
      console.error(`❌ package.json에 ${field} 필드가 누락되었습니다.`);
      process.exit(1);
    }
  }

  // main 필드가 빌드된 파일을 가리키는지 확인
  if (packageJson.main !== 'dist/index.js') {
    console.error('❌ package.json의 main 필드가 dist/index.js를 가리키지 않습니다.');
    process.exit(1);
  }

  // ES Module 설정 확인
  if (packageJson.type !== 'module') {
    console.error('❌ package.json의 type이 "module"이 아닙니다.');
    process.exit(1);
  }

  console.log('✅ package.json 일관성 확인 완료');
} catch (error) {
  console.error('❌ package.json 확인 실패:', error.message);
  process.exit(1);
}

// 환경변수 예시 파일 확인
console.log('\n🔧 환경설정 파일 확인...');
const envExample = join(projectRoot, '.env.example');
if (!existsSync(envExample)) {
  console.error('❌ .env.example 파일이 누락되었습니다.');
  process.exit(1);
}

try {
  const envContent = readFileSync(envExample, 'utf8');
  if (!envContent.includes('TTB_KEY=')) {
    console.error('❌ .env.example에 TTB_KEY 설정이 누락되었습니다.');
    process.exit(1);
  }
  console.log('✅ 환경설정 파일 확인 완료');
} catch (error) {
  console.error('❌ 환경설정 파일 확인 실패:', error.message);
  process.exit(1);
}

// 보안 검사
console.log('\n🔒 보안 검사...');
const sensitivePatterns = [
  /ttbalbert\.rim1712001/g,
  /password\s*=\s*[^\s]/i,
  /secret\s*=\s*[^\s]/i,
  /token\s*=\s*[^\s]/i
];

let securityIssues = [];
for (const file of requiredFiles) {
  const filePath = join(distDir, file);
  if (existsSync(filePath)) {
    const content = readFileSync(filePath, 'utf8');
    for (const pattern of sensitivePatterns) {
      if (pattern.test(content)) {
        securityIssues.push(`${file}: ${pattern.source}`);
      }
    }
  }
}

if (securityIssues.length > 0) {
  console.error('❌ 보안 문제 발견:');
  securityIssues.forEach(issue => console.error(`  - ${issue}`));
  process.exit(1);
}

console.log('✅ 보안 검사 통과');

// 최종 결과
console.log('\n🎉 빌드 검증이 성공적으로 완료되었습니다!');
console.log('📊 검증 결과:');
console.log(`  - 필수 파일: ${requiredFiles.length}개 모두 존재`);
console.log(`  - 메인 파일 크기: ${fileSizeKB} KB`);
console.log('  - 구문 검사: 통과');
console.log('  - 패키지 일관성: 통과');
console.log('  - 보안 검사: 통과');
console.log('\n✅ 배포 준비가 완료되었습니다!');

process.exit(0);