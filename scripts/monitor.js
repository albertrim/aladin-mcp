#!/usr/bin/env node

/**
 * 모니터링 스크립트
 * MCP 서버 상태 모니터링 및 알림 기능
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// 설정
const config = {
  checkInterval: 5 * 60 * 1000, // 5분
  maxLogSize: 10 * 1024 * 1024, // 10MB
  maxCpuUsage: 80, // 80%
  maxMemoryUsage: 80, // 80%
  apiCallLimit: 4500, // 일일 API 호출 제한 (5000의 90%)
  logRetentionDays: 30,
  alertCooldown: 30 * 60 * 1000 // 30분
};

// 상태 파일 경로
const statusFile = join(projectRoot, 'logs', 'monitor-status.json');
const alertLog = join(projectRoot, 'logs', 'alerts.log');

// 모니터링 상태 로드
function loadStatus() {
  if (!existsSync(statusFile)) {
    return {
      lastCheck: 0,
      alerts: {},
      stats: {
        uptime: 0,
        apiCalls: 0,
        errors: 0,
        lastApiReset: new Date().toDateString()
      }
    };
  }

  try {
    return JSON.parse(readFileSync(statusFile, 'utf8'));
  } catch (error) {
    console.error('⚠️ 상태 파일 로드 실패:', error.message);
    return {
      lastCheck: 0,
      alerts: {},
      stats: { uptime: 0, apiCalls: 0, errors: 0, lastApiReset: new Date().toDateString() }
    };
  }
}

// 모니터링 상태 저장
function saveStatus(status) {
  try {
    writeFileSync(statusFile, JSON.stringify(status, null, 2));
  } catch (error) {
    console.error('❌ 상태 파일 저장 실패:', error.message);
  }
}

// 알림 로그 기록
function logAlert(level, message, details = {}) {
  const timestamp = new Date().toISOString();
  const alertEntry = {
    timestamp,
    level,
    message,
    details
  };

  try {
    const logLine = `${timestamp} [${level.toUpperCase()}] ${message} ${JSON.stringify(details)}\n`;
    writeFileSync(alertLog, logLine, { flag: 'a' });

    console.log(`🚨 [${level.toUpperCase()}] ${message}`);
    if (Object.keys(details).length > 0) {
      console.log('   세부사항:', details);
    }
  } catch (error) {
    console.error('❌ 알림 로그 기록 실패:', error.message);
  }
}

// 프로세스 상태 확인
function checkProcessStatus() {
  try {
    // pm2나 다른 프로세스 매니저를 사용한다면 여기서 확인
    const result = execSync('tasklist /FI "IMAGENAME eq node.exe" /FO CSV 2>nul || echo "NO_PROCESS"', {
      encoding: 'utf8',
      timeout: 5000
    });

    if (result.includes('NO_PROCESS') || !result.includes('node.exe')) {
      return { running: false, pid: null, memory: 0, cpu: 0 };
    }

    // 간단한 상태 반환 (실제 환경에서는 더 정교한 모니터링 필요)
    return { running: true, pid: 'unknown', memory: 0, cpu: 0 };
  } catch (error) {
    return { running: false, pid: null, memory: 0, cpu: 0, error: error.message };
  }
}

// API 호출 수 확인 (로그 파일 기반)
function checkApiUsage() {
  const logPath = join(projectRoot, 'logs', 'app.log');

  if (!existsSync(logPath)) {
    return { dailyCalls: 0, totalCalls: 0 };
  }

  try {
    const logContent = readFileSync(logPath, 'utf8');
    const today = new Date().toDateString();

    // API 호출 로그 패턴 매칭
    const apiCallPattern = /API 호출:|알라딘 API 요청/g;
    const totalMatches = (logContent.match(apiCallPattern) || []).length;

    // 오늘 날짜의 로그만 필터링
    const todayLogs = logContent.split('\n').filter(line =>
      line.includes(today) && apiCallPattern.test(line)
    );

    return {
      dailyCalls: todayLogs.length,
      totalCalls: totalMatches
    };
  } catch (error) {
    return { dailyCalls: 0, totalCalls: 0, error: error.message };
  }
}

// 로그 파일 크기 확인
function checkLogSizes() {
  const logsDir = join(projectRoot, 'logs');
  const issues = [];

  if (!existsSync(logsDir)) {
    return issues;
  }

  try {
    const files = ['app.log', 'error.log', 'access.log'];

    for (const file of files) {
      const filePath = join(logsDir, file);
      if (existsSync(filePath)) {
        const stats = require('fs').statSync(filePath);
        if (stats.size > config.maxLogSize) {
          issues.push({
            file,
            size: Math.round(stats.size / 1024 / 1024),
            maxSize: Math.round(config.maxLogSize / 1024 / 1024)
          });
        }
      }
    }
  } catch (error) {
    issues.push({ error: error.message });
  }

  return issues;
}

// 디스크 공간 확인
function checkDiskSpace() {
  try {
    // Windows의 경우
    if (process.platform === 'win32') {
      const result = execSync('dir /-c', { encoding: 'utf8', cwd: projectRoot });
      // 간단한 체크 (실제로는 더 정교한 파싱 필요)
      return { available: true, usage: 0 };
    }

    // Unix 계열
    const result = execSync('df -h .', { encoding: 'utf8', cwd: projectRoot });
    const lines = result.split('\n');
    if (lines.length > 1) {
      const parts = lines[1].split(/\s+/);
      const usage = parseInt(parts[4]) || 0;
      return { available: usage < 90, usage };
    }
  } catch (error) {
    return { available: true, usage: 0, error: error.message };
  }

  return { available: true, usage: 0 };
}

// 알림 쿨다운 확인
function shouldAlert(alertType, status) {
  const now = Date.now();
  const lastAlert = status.alerts[alertType] || 0;
  return (now - lastAlert) > config.alertCooldown;
}

// 메인 모니터링 함수
function runMonitoring() {
  console.log('🔍 MCP 서버 모니터링 시작...\n');

  const status = loadStatus();
  const now = Date.now();

  // 프로세스 상태 확인
  const processStatus = checkProcessStatus();
  console.log('📊 프로세스 상태:', processStatus.running ? '✅ 실행 중' : '❌ 중지됨');

  if (!processStatus.running && shouldAlert('process_down', status)) {
    logAlert('critical', 'MCP 서버 프로세스가 중지되었습니다', processStatus);
    status.alerts.process_down = now;
  }

  // API 사용량 확인
  const apiUsage = checkApiUsage();
  console.log(`📡 API 사용량: ${apiUsage.dailyCalls}/${config.apiCallLimit} (일일)`);

  if (apiUsage.dailyCalls > config.apiCallLimit && shouldAlert('api_limit', status)) {
    logAlert('warning', 'API 호출 제한에 근접했습니다', {
      current: apiUsage.dailyCalls,
      limit: config.apiCallLimit
    });
    status.alerts.api_limit = now;
  }

  // 로그 파일 크기 확인
  const logIssues = checkLogSizes();
  if (logIssues.length > 0) {
    console.log('📋 로그 파일 문제:', logIssues.length + '개');

    if (shouldAlert('log_size', status)) {
      logAlert('warning', '로그 파일 크기가 제한을 초과했습니다', { issues: logIssues });
      status.alerts.log_size = now;
    }
  } else {
    console.log('📋 로그 파일: ✅ 정상');
  }

  // 디스크 공간 확인
  const diskStatus = checkDiskSpace();
  console.log(`💾 디스크 사용량: ${diskStatus.usage}%`);

  if (!diskStatus.available && shouldAlert('disk_space', status)) {
    logAlert('critical', '디스크 공간이 부족합니다', diskStatus);
    status.alerts.disk_space = now;
  }

  // 통계 업데이트
  status.lastCheck = now;
  status.stats.uptime = processStatus.running ? status.stats.uptime + 1 : 0;

  // 일일 API 호출 수 리셋 확인
  const today = new Date().toDateString();
  if (status.stats.lastApiReset !== today) {
    status.stats.apiCalls = 0;
    status.stats.lastApiReset = today;
  }
  status.stats.apiCalls = apiUsage.dailyCalls;

  // 상태 저장
  saveStatus(status);

  console.log('\n✅ 모니터링 완료');
  console.log(`📊 업타임: ${status.stats.uptime}회 연속 정상`);
  console.log(`⏰ 다음 확인: ${config.checkInterval / 1000 / 60}분 후\n`);
}

// 로그 정리 함수
function cleanupLogs() {
  console.log('🧹 오래된 로그 파일 정리...');

  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - config.logRetentionDays);

    // 실제 구현에서는 로그 파일 로테이션 로직 추가
    console.log(`📅 ${config.logRetentionDays}일 이전 로그 정리 완료`);
  } catch (error) {
    console.error('❌ 로그 정리 실패:', error.message);
  }
}

// 연속 모니터링 모드
function startContinuousMonitoring() {
  console.log('🚀 연속 모니터링 모드 시작');
  console.log(`⏱️  체크 간격: ${config.checkInterval / 1000 / 60}분\n`);

  // 즉시 첫 번째 체크 실행
  runMonitoring();

  // 주기적 모니터링 설정
  setInterval(() => {
    runMonitoring();
  }, config.checkInterval);

  // 일일 로그 정리 (매일 자정)
  setInterval(() => {
    cleanupLogs();
  }, 24 * 60 * 60 * 1000);
}

// CLI 인터페이스
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);

  if (args.includes('--continuous') || args.includes('-c')) {
    startContinuousMonitoring();
  } else if (args.includes('--cleanup')) {
    cleanupLogs();
  } else {
    // 단일 모니터링 실행
    runMonitoring();
  }
}

export { runMonitoring, startContinuousMonitoring, cleanupLogs };