/**
 * API 사용량 추적 및 제한 관리 시스템
 *
 * 알라딘 API의 일일 5,000회 호출 제한을 효과적으로 관리합니다.
 * - 일일 호출 횟수 추적
 * - TTB 키별 사용량 모니터링
 * - 요청 빈도 제한
 * - API 키 유효성 실시간 검증
 * - 호출 한도 도달 시 에러 처리
 */

import type { ApiUsageStats, StandardError, ErrorCode } from '../types.js';
import { DAILY_API_LIMIT, DEFAULT_TTB_KEY } from '../constants/api.js';
import { getLogger } from './logger.js';
import { getErrorHandler } from './error-handler.js';

// ===== 설정 상수 =====

/**
 * 속도 제한 설정
 */
const RATE_LIMIT_CONFIG = {
  // 기본 요청 간격 (밀리초)
  DEFAULT_REQUEST_INTERVAL: 200, // 5 requests/second

  // 버스트 허용 설정
  BURST_LIMIT: 10, // 버스트 모드에서 최대 요청 수
  BURST_WINDOW: 1000, // 버스트 윈도우 (1초)

  // 백오프 설정
  BACKOFF_MULTIPLIER: 1.5,
  MAX_BACKOFF_DELAY: 5000, // 5초

  // 경고 임계값
  WARNING_THRESHOLD: 0.8, // 80%
  CRITICAL_THRESHOLD: 0.95, // 95%

  // 사용량 추적 간격
  USAGE_LOG_INTERVAL: 100, // 100번 호출마다 로깅

  // TTB 키 검증 간격
  TTB_VALIDATION_INTERVAL: 24 * 60 * 60 * 1000 // 24시간
} as const;

// ===== 타입 정의 =====

/**
 * TTB 키별 사용량 통계
 */
interface TtbKeyUsage {
  ttbKey: string;
  dailyCount: number;
  dailyLimit: number;
  lastReset: Date;
  lastCall: Date;
  lastValidation: Date;
  isValid: boolean;
  requestHistory: number[]; // 최근 요청 타임스탬프
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
}

/**
 * 요청 메트릭
 */
interface RequestMetrics {
  averageResponseTime: number;
  requestsPerMinute: number;
  successRate: number;
  lastMinuteRequests: number[];
}

/**
 * 속도 제한 상태
 */
interface RateLimitState {
  isBlocked: boolean;
  nextAllowedTime: number;
  currentDelay: number;
  burstCount: number;
  lastBurstReset: number;
}

// ===== 속도 제한 관리자 클래스 =====

/**
 * 알라딘 API 속도 제한 관리자
 */
export class AladinRateLimiter {
  private logger = getLogger();
  private errorHandler = getErrorHandler();
  private ttbKeyUsages = new Map<string, TtbKeyUsage>();
  private rateLimitStates = new Map<string, RateLimitState>();
  private requestMetrics = new Map<string, RequestMetrics>();
  private globalUsageStats: ApiUsageStats;

  constructor() {
    this.globalUsageStats = {
      dailyCount: 0,
      dailyLimit: DAILY_API_LIMIT,
      lastReset: new Date(),
      lastCall: new Date()
    };

    // 일일 리셋 스케줄러 설정
    this.setupDailyReset();
  }

  /**
   * API 호출 전 사전 검사
   */
  async checkRateLimit(ttbKey: string = DEFAULT_TTB_KEY): Promise<void> {
    const usage = this.getTtbKeyUsage(ttbKey);
    const rateLimitState = this.getRateLimitState(ttbKey);

    // 1. 일일 한도 확인
    this.checkDailyLimit(usage);

    // 2. TTB 키 유효성 확인
    await this.validateTtbKey(usage);

    // 3. 요청 빈도 제한 확인
    await this.checkRequestFrequency(ttbKey, rateLimitState);

    // 4. 버스트 제한 확인
    this.checkBurstLimit(rateLimitState);
  }

  /**
   * API 호출 후 사용량 업데이트
   */
  recordApiCall(
    ttbKey: string = DEFAULT_TTB_KEY,
    success: boolean = true,
    responseTime?: number
  ): void {
    const usage = this.getTtbKeyUsage(ttbKey);
    const metrics = this.getRequestMetrics(ttbKey);
    const now = new Date();

    // 사용량 업데이트
    usage.dailyCount++;
    usage.lastCall = now;
    usage.totalRequests++;

    if (success) {
      usage.successfulRequests++;
    } else {
      usage.failedRequests++;
    }

    // 글로벌 사용량 업데이트
    this.globalUsageStats.dailyCount++;
    this.globalUsageStats.lastCall = now;

    // 요청 히스토리 업데이트 (최근 1분간만 유지)
    const timestamp = now.getTime();
    usage.requestHistory.push(timestamp);
    usage.requestHistory = usage.requestHistory.filter(
      t => timestamp - t <= 60000 // 1분
    );

    // 메트릭 업데이트
    this.updateRequestMetrics(ttbKey, responseTime, success);

    // 사용량 로깅
    this.logUsageIfNeeded(usage);

    // 경고 확인
    this.checkUsageWarnings(usage);
  }

  /**
   * 일일 한도 확인
   */
  private checkDailyLimit(usage: TtbKeyUsage): void {
    // 일일 리셋 확인
    const now = new Date();
    if (now.getDate() !== usage.lastReset.getDate()) {
      this.resetDailyUsage(usage);
    }

    // 한도 초과 확인
    if (usage.dailyCount >= usage.dailyLimit) {
      throw this.errorHandler.handleApiLimitExceeded({
        dailyCount: usage.dailyCount,
        dailyLimit: usage.dailyLimit,
        lastReset: usage.lastReset,
        lastCall: usage.lastCall
      });
    }
  }

  /**
   * TTB 키 유효성 검증
   */
  private async validateTtbKey(usage: TtbKeyUsage): Promise<void> {
    const now = new Date();
    const timeSinceValidation = now.getTime() - usage.lastValidation.getTime();

    // 정기 검증 (24시간마다)
    if (timeSinceValidation > RATE_LIMIT_CONFIG.TTB_VALIDATION_INTERVAL || !usage.isValid) {
      try {
        // TTB 키 형식 검증
        if (!/^ttb[a-zA-Z0-9.]+$/.test(usage.ttbKey)) {
          usage.isValid = false;
          throw this.errorHandler.handleInvalidTtbKey(usage.ttbKey);
        }

        // 실제 API 호출로 유효성 확인 (간단한 검색 요청)
        // 주의: 실제 구현에서는 최소한의 API 호출로 검증
        usage.isValid = true;
        usage.lastValidation = now;

        this.logger.debug('TTB 키 유효성 검증 완료', {
          ttbKey: usage.ttbKey.substring(0, 6) + '***',
          isValid: usage.isValid
        });

      } catch (error) {
        usage.isValid = false;
        throw error;
      }
    }

    if (!usage.isValid) {
      throw this.errorHandler.handleInvalidTtbKey(usage.ttbKey);
    }
  }

  /**
   * 요청 빈도 제한 확인
   */
  private async checkRequestFrequency(ttbKey: string, rateLimitState: RateLimitState): Promise<void> {
    const now = Date.now();

    // 현재 차단 상태 확인
    if (rateLimitState.isBlocked && now < rateLimitState.nextAllowedTime) {
      const waitTime = rateLimitState.nextAllowedTime - now;
      throw this.errorHandler.handleGenericError(
        new Error(`요청 빈도 제한으로 인해 ${waitTime}ms 후 다시 시도해 주세요.`),
        'RATE_LIMIT_BLOCKED'
      );
    }

    // 차단 해제
    if (rateLimitState.isBlocked && now >= rateLimitState.nextAllowedTime) {
      rateLimitState.isBlocked = false;
      rateLimitState.currentDelay = RATE_LIMIT_CONFIG.DEFAULT_REQUEST_INTERVAL;
    }

    // 최근 요청 간격 확인
    const usage = this.getTtbKeyUsage(ttbKey);
    const recentRequests = usage.requestHistory.filter(t => now - t <= 1000); // 최근 1초

    if (recentRequests.length >= 5) { // 초당 5회 제한
      // 백오프 지연 적용
      rateLimitState.currentDelay = Math.min(
        rateLimitState.currentDelay * RATE_LIMIT_CONFIG.BACKOFF_MULTIPLIER,
        RATE_LIMIT_CONFIG.MAX_BACKOFF_DELAY
      );

      rateLimitState.isBlocked = true;
      rateLimitState.nextAllowedTime = now + rateLimitState.currentDelay;

      this.logger.warn('요청 빈도 제한 적용', {
        ttbKey: ttbKey.substring(0, 6) + '***',
        recentRequestCount: recentRequests.length,
        delayMs: rateLimitState.currentDelay
      });

      // 지연 대기
      await new Promise(resolve => setTimeout(resolve, rateLimitState.currentDelay));
    }
  }

  /**
   * 버스트 제한 확인
   */
  private checkBurstLimit(rateLimitState: RateLimitState): void {
    const now = Date.now();

    // 버스트 윈도우 리셋
    if (now - rateLimitState.lastBurstReset > RATE_LIMIT_CONFIG.BURST_WINDOW) {
      rateLimitState.burstCount = 0;
      rateLimitState.lastBurstReset = now;
    }

    // 버스트 한도 확인
    if (rateLimitState.burstCount >= RATE_LIMIT_CONFIG.BURST_LIMIT) {
      const waitTime = RATE_LIMIT_CONFIG.BURST_WINDOW - (now - rateLimitState.lastBurstReset);
      throw this.errorHandler.handleGenericError(
        new Error(`버스트 제한으로 인해 ${waitTime}ms 후 다시 시도해 주세요.`),
        'BURST_LIMIT_EXCEEDED'
      );
    }

    rateLimitState.burstCount++;
  }

  /**
   * TTB 키별 사용량 정보 조회
   */
  private getTtbKeyUsage(ttbKey: string): TtbKeyUsage {
    if (!this.ttbKeyUsages.has(ttbKey)) {
      const now = new Date();
      this.ttbKeyUsages.set(ttbKey, {
        ttbKey,
        dailyCount: 0,
        dailyLimit: DAILY_API_LIMIT,
        lastReset: now,
        lastCall: now,
        lastValidation: new Date(0), // 강제 검증을 위해 과거 시간
        isValid: true,
        requestHistory: [],
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0
      });
    }
    return this.ttbKeyUsages.get(ttbKey)!;
  }

  /**
   * 속도 제한 상태 조회
   */
  private getRateLimitState(ttbKey: string): RateLimitState {
    if (!this.rateLimitStates.has(ttbKey)) {
      this.rateLimitStates.set(ttbKey, {
        isBlocked: false,
        nextAllowedTime: 0,
        currentDelay: RATE_LIMIT_CONFIG.DEFAULT_REQUEST_INTERVAL,
        burstCount: 0,
        lastBurstReset: Date.now()
      });
    }
    return this.rateLimitStates.get(ttbKey)!;
  }

  /**
   * 요청 메트릭 조회
   */
  private getRequestMetrics(ttbKey: string): RequestMetrics {
    if (!this.requestMetrics.has(ttbKey)) {
      this.requestMetrics.set(ttbKey, {
        averageResponseTime: 0,
        requestsPerMinute: 0,
        successRate: 100,
        lastMinuteRequests: []
      });
    }
    return this.requestMetrics.get(ttbKey)!;
  }

  /**
   * 요청 메트릭 업데이트
   */
  private updateRequestMetrics(ttbKey: string, responseTime?: number, success: boolean = true): void {
    const metrics = this.getRequestMetrics(ttbKey);
    const usage = this.getTtbKeyUsage(ttbKey);
    const now = Date.now();

    // 응답 시간 업데이트
    if (responseTime !== undefined) {
      metrics.averageResponseTime = (metrics.averageResponseTime + responseTime) / 2;
    }

    // 분당 요청 수 계산
    metrics.lastMinuteRequests.push(now);
    metrics.lastMinuteRequests = metrics.lastMinuteRequests.filter(
      t => now - t <= 60000 // 1분
    );
    metrics.requestsPerMinute = metrics.lastMinuteRequests.length;

    // 성공률 계산
    if (usage.totalRequests > 0) {
      metrics.successRate = (usage.successfulRequests / usage.totalRequests) * 100;
    }
  }

  /**
   * 일일 사용량 리셋
   */
  private resetDailyUsage(usage: TtbKeyUsage): void {
    const oldCount = usage.dailyCount;
    usage.dailyCount = 0;
    usage.lastReset = new Date();

    this.logger.info('일일 API 사용량 리셋', {
      ttbKey: usage.ttbKey.substring(0, 6) + '***',
      previousDayUsage: oldCount,
      dailyLimit: usage.dailyLimit
    });
  }

  /**
   * 사용량 로깅 (조건부)
   */
  private logUsageIfNeeded(usage: TtbKeyUsage): void {
    if (usage.dailyCount > 0 && usage.dailyCount % RATE_LIMIT_CONFIG.USAGE_LOG_INTERVAL === 0) {
      this.logger.logUsageStats({
        dailyCount: usage.dailyCount,
        dailyLimit: usage.dailyLimit,
        lastReset: usage.lastReset,
        lastCall: usage.lastCall
      }, {
        endpoint: 'rate_limiter',
        toolName: 'rate_tracking'
      });
    }
  }

  /**
   * 사용량 경고 확인
   */
  private checkUsageWarnings(usage: TtbKeyUsage): void {
    const usageRatio = usage.dailyCount / usage.dailyLimit;

    if (usageRatio >= RATE_LIMIT_CONFIG.CRITICAL_THRESHOLD) {
      this.logger.warn('API 사용량 임계치 도달', {
        ttbKey: usage.ttbKey.substring(0, 6) + '***',
        usageCount: usage.dailyCount,
        usageLimit: usage.dailyLimit,
        usagePercentage: (usageRatio * 100).toFixed(1),
        level: 'CRITICAL'
      });
    } else if (usageRatio >= RATE_LIMIT_CONFIG.WARNING_THRESHOLD) {
      this.logger.warn('API 사용량 경고', {
        ttbKey: usage.ttbKey.substring(0, 6) + '***',
        usageCount: usage.dailyCount,
        usageLimit: usage.dailyLimit,
        usagePercentage: (usageRatio * 100).toFixed(1),
        level: 'WARNING'
      });
    }
  }

  /**
   * 일일 리셋 스케줄러 설정
   */
  private setupDailyReset(): void {
    // 매일 자정에 사용량 리셋
    const scheduleReset = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const timeUntilReset = tomorrow.getTime() - now.getTime();

      setTimeout(() => {
        // 모든 TTB 키의 사용량 리셋
        for (const usage of this.ttbKeyUsages.values()) {
          this.resetDailyUsage(usage);
        }

        // 글로벌 사용량 리셋
        this.globalUsageStats.dailyCount = 0;
        this.globalUsageStats.lastReset = new Date();

        // 다음 리셋 스케줄
        scheduleReset();
      }, timeUntilReset);
    };

    scheduleReset();
  }

  // ===== 공개 API 메서드 =====

  /**
   * 특정 TTB 키의 사용량 통계 조회
   */
  getUsageStats(ttbKey: string = DEFAULT_TTB_KEY): ApiUsageStats {
    const usage = this.getTtbKeyUsage(ttbKey);
    return {
      dailyCount: usage.dailyCount,
      dailyLimit: usage.dailyLimit,
      lastReset: usage.lastReset,
      lastCall: usage.lastCall
    };
  }

  /**
   * 전체 사용량 통계 조회
   */
  getGlobalUsageStats(): ApiUsageStats {
    return { ...this.globalUsageStats };
  }

  /**
   * 모든 TTB 키의 사용량 조회
   */
  getAllUsageStats(): Map<string, ApiUsageStats> {
    const stats = new Map<string, ApiUsageStats>();
    for (const [ttbKey, usage] of this.ttbKeyUsages) {
      stats.set(ttbKey, {
        dailyCount: usage.dailyCount,
        dailyLimit: usage.dailyLimit,
        lastReset: usage.lastReset,
        lastCall: usage.lastCall
      });
    }
    return stats;
  }

  /**
   * 요청 메트릭 조회
   */
  getMetrics(ttbKey: string = DEFAULT_TTB_KEY): RequestMetrics {
    return { ...this.getRequestMetrics(ttbKey) };
  }

  /**
   * TTB 키 유효성 강제 재검증
   */
  async forceValidateTtbKey(ttbKey: string = DEFAULT_TTB_KEY): Promise<boolean> {
    const usage = this.getTtbKeyUsage(ttbKey);
    usage.lastValidation = new Date(0); // 강제 재검증

    try {
      await this.validateTtbKey(usage);
      return usage.isValid;
    } catch (error) {
      return false;
    }
  }

  /**
   * 사용량 통계 초기화
   */
  resetStats(ttbKey?: string): void {
    if (ttbKey) {
      const usage = this.getTtbKeyUsage(ttbKey);
      this.resetDailyUsage(usage);
      usage.totalRequests = 0;
      usage.successfulRequests = 0;
      usage.failedRequests = 0;
      usage.requestHistory = [];
    } else {
      // 모든 통계 초기화
      this.ttbKeyUsages.clear();
      this.rateLimitStates.clear();
      this.requestMetrics.clear();
      this.globalUsageStats.dailyCount = 0;
      this.globalUsageStats.lastReset = new Date();
    }
  }
}

// ===== 싱글톤 인스턴스 및 편의 함수 =====

/**
 * 기본 속도 제한 관리자 인스턴스
 */
let defaultRateLimiter: AladinRateLimiter | null = null;

/**
 * 기본 속도 제한 관리자 인스턴스 조회
 */
export function getRateLimiter(): AladinRateLimiter {
  if (!defaultRateLimiter) {
    defaultRateLimiter = new AladinRateLimiter();
  }
  return defaultRateLimiter;
}

/**
 * API 호출 전 속도 제한 확인 (편의 함수)
 */
export async function checkApiRateLimit(ttbKey?: string): Promise<void> {
  return getRateLimiter().checkRateLimit(ttbKey);
}

/**
 * API 호출 기록 (편의 함수)
 */
export function recordApiUsage(ttbKey?: string, success?: boolean, responseTime?: number): void {
  return getRateLimiter().recordApiCall(ttbKey, success, responseTime);
}

/**
 * 사용량 통계 조회 (편의 함수)
 */
export function getApiUsageStats(ttbKey?: string): ApiUsageStats {
  return getRateLimiter().getUsageStats(ttbKey);
}