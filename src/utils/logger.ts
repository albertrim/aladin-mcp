/**
 * 알라딘 OpenAPI MCP 서버용 로깅 유틸리티
 *
 * Winston 기반의 구조화된 로깅 시스템을 제공합니다.
 * 로깅 레벨, API 호출 추적, 에러 로깅, 사용량 통계 등을 지원합니다.
 */

import { createLogger, format, transports, Logger } from 'winston';
import path from 'path';
import type {
  StandardError,
  ApiUsageStats,
  SearchBooksParams,
  BookDetailsParams,
  ItemListParams
} from '../types.js';

// ===== 로깅 설정 타입 =====

/**
 * 로깅 레벨 타입
 */
export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

/**
 * 로깅 설정 인터페이스
 */
export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableFile: boolean;
  logDir: string;
  maxFiles: number;
  maxSize: string;
  sensitiveFields: string[];
}

/**
 * API 호출 로그 정보
 */
export interface ApiCallLog {
  endpoint: string;
  method: string;
  params: Record<string, any>;
  responseTime: number;
  statusCode?: number;
  success: boolean;
  error?: StandardError;
  timestamp: string;
  requestId: string;
}

/**
 * 에러 로그 정보
 */
export interface ErrorLog {
  error: StandardError;
  context?: Record<string, any>;
  stackTrace?: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * 사용량 통계 로그 정보
 */
export interface UsageStatsLog {
  apiUsage: ApiUsageStats;
  endpoint?: string;
  toolName?: string;
  userAgent?: string;
  timestamp: string;
}

// ===== 기본 설정 =====

/**
 * 기본 로거 설정
 */
const DEFAULT_CONFIG: LoggerConfig = {
  level: (process.env.LOG_LEVEL as LogLevel) || 'info',
  enableConsole: process.env.NODE_ENV !== 'production',
  enableFile: true,
  logDir: process.env.LOG_DIR || path.join(process.cwd(), 'logs'),
  maxFiles: 30, // 30일간 보관
  maxSize: '10m', // 파일당 최대 10MB
  sensitiveFields: ['TTBKey', 'password', 'token', 'apiKey', 'secret']
};

/**
 * 민감 정보 마스킹 패턴
 */
const SENSITIVE_PATTERNS = {
  ttbKey: /ttb[a-zA-Z0-9.]+/g,
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  phone: /\d{3}-\d{3,4}-\d{4}/g,
  isbn: /\d{10,13}/g // ISBN은 마스킹하지 않음 (공개 정보)
};

// ===== 유틸리티 함수 =====

/**
 * 고유한 요청 ID를 생성합니다
 * @returns 요청 ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 민감한 정보를 마스킹합니다
 * @param obj 마스킹할 객체
 * @param sensitiveFields 민감한 필드 목록
 * @returns 마스킹된 객체
 */
function maskSensitiveData(obj: any, sensitiveFields: string[]): any {
  if (!obj || typeof obj !== 'object') return obj;

  const masked = Array.isArray(obj) ? [...obj] : { ...obj };

  for (const [key, value] of Object.entries(masked)) {
    if (sensitiveFields.includes(key)) {
      if (typeof value === 'string') {
        masked[key] = '***masked***';
      } else {
        masked[key] = '[MASKED]';
      }
    } else if (typeof value === 'object' && value !== null) {
      masked[key] = maskSensitiveData(value, sensitiveFields);
    } else if (typeof value === 'string') {
      // 문자열 내 민감 정보 패턴 마스킹
      let maskedValue = value;
      for (const [patternName, pattern] of Object.entries(SENSITIVE_PATTERNS)) {
        if (patternName === 'ttbKey') {
          maskedValue = maskedValue.replace(pattern, 'ttb***');
        } else if (patternName === 'email') {
          maskedValue = maskedValue.replace(pattern, '***@***.***');
        } else if (patternName === 'phone') {
          maskedValue = maskedValue.replace(pattern, '***-***-****');
        }
      }
      masked[key] = maskedValue;
    }
  }

  return masked;
}

/**
 * 에러의 심각도를 결정합니다
 * @param error 에러 객체
 * @returns 심각도 레벨
 */
function determineSeverity(error: StandardError): 'low' | 'medium' | 'high' | 'critical' {
  switch (error.code) {
    case 100: // TTB 키 오류
      return 'high';
    case 901: // 일일 한도 초과
      return 'critical';
    case 900: // 시스템 오류
      return 'high';
    case 200: // 필수 파라미터 누락
    case 300: // 잘못된 파라미터
      return 'medium';
    default:
      return 'low';
  }
}

// ===== 로거 클래스 =====

/**
 * 알라딘 MCP 서버용 로거
 */
export class AladinLogger {
  private logger: Logger;
  private config: LoggerConfig;
  private requestCounter: number = 0;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.logger = this.createWinstonLogger();
  }

  /**
   * Winston 로거를 생성합니다
   * @returns Winston 로거 인스턴스
   */
  private createWinstonLogger(): Logger {
    const logFormat = format.combine(
      format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
      format.errors({ stack: true }),
      format.json(),
      format.printf(({ timestamp, level, message, ...meta }) => {
        return JSON.stringify({
          timestamp,
          level,
          message,
          ...meta
        });
      })
    );

    const loggerTransports: any[] = [];

    // 콘솔 출력 설정
    if (this.config.enableConsole) {
      loggerTransports.push(
        new transports.Console({
          level: this.config.level,
          format: format.combine(
            format.colorize(),
            format.simple(),
            format.printf(({ timestamp, level, message, ...meta }) => {
              const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
              return `${timestamp} [${level}]: ${message} ${metaStr}`;
            })
          )
        })
      );
    }

    // 파일 출력 설정
    if (this.config.enableFile) {
      // 일반 로그 파일
      loggerTransports.push(
        new transports.File({
          filename: path.join(this.config.logDir, 'aladin-mcp.log'),
          level: this.config.level,
          format: logFormat,
          maxsize: parseInt(this.config.maxSize) * 1024 * 1024,
          maxFiles: this.config.maxFiles,
          tailable: true
        })
      );

      // 에러 전용 로그 파일
      loggerTransports.push(
        new transports.File({
          filename: path.join(this.config.logDir, 'error.log'),
          level: 'error',
          format: logFormat,
          maxsize: parseInt(this.config.maxSize) * 1024 * 1024,
          maxFiles: this.config.maxFiles,
          tailable: true
        })
      );

      // API 호출 전용 로그 파일
      loggerTransports.push(
        new transports.File({
          filename: path.join(this.config.logDir, 'api-calls.log'),
          level: 'info',
          format: logFormat,
          maxsize: parseInt(this.config.maxSize) * 1024 * 1024,
          maxFiles: this.config.maxFiles,
          tailable: true
        })
      );
    }

    return createLogger({
      level: this.config.level,
      format: logFormat,
      transports: loggerTransports,
      exitOnError: false
    });
  }

  /**
   * 디버그 로그를 기록합니다
   * @param message 메시지
   * @param meta 추가 정보
   */
  debug(message: string, meta?: Record<string, any>): void {
    const sanitizedMeta = meta ? maskSensitiveData(meta, this.config.sensitiveFields) : {};
    this.logger.debug(message, sanitizedMeta);
  }

  /**
   * 정보 로그를 기록합니다
   * @param message 메시지
   * @param meta 추가 정보
   */
  info(message: string, meta?: Record<string, any>): void {
    const sanitizedMeta = meta ? maskSensitiveData(meta, this.config.sensitiveFields) : {};
    this.logger.info(message, sanitizedMeta);
  }

  /**
   * 경고 로그를 기록합니다
   * @param message 메시지
   * @param meta 추가 정보
   */
  warn(message: string, meta?: Record<string, any>): void {
    const sanitizedMeta = meta ? maskSensitiveData(meta, this.config.sensitiveFields) : {};
    this.logger.warn(message, sanitizedMeta);
  }

  /**
   * 에러 로그를 기록합니다
   * @param message 메시지
   * @param error 에러 객체
   * @param meta 추가 정보
   */
  error(message: string, error?: Error | StandardError, meta?: Record<string, any>): void {
    const sanitizedMeta = meta ? maskSensitiveData(meta, this.config.sensitiveFields) : {};
    const logData = {
      ...sanitizedMeta,
      error: error ? {
        message: error.message,
        stack: error instanceof Error ? error.stack : undefined,
        ...('code' in error ? { code: error.code } : {})
      } : undefined
    };

    this.logger.error(message, logData);
  }

  /**
   * API 호출 시작을 로깅합니다
   * @param endpoint API 엔드포인트
   * @param params 요청 파라미터
   * @returns 요청 ID
   */
  logApiCallStart(endpoint: string, params: Record<string, any>): string {
    const requestId = generateRequestId();
    this.requestCounter++;

    const sanitizedParams = maskSensitiveData(params, this.config.sensitiveFields);

    this.info('API 호출 시작', {
      type: 'api_call_start',
      requestId,
      endpoint,
      params: sanitizedParams,
      requestNumber: this.requestCounter
    });

    return requestId;
  }

  /**
   * API 호출 완료를 로깅합니다
   * @param requestId 요청 ID
   * @param endpoint API 엔드포인트
   * @param params 요청 파라미터
   * @param responseTime 응답 시간 (ms)
   * @param success 성공 여부
   * @param error 에러 정보 (실패 시)
   */
  logApiCallEnd(
    requestId: string,
    endpoint: string,
    params: Record<string, any>,
    responseTime: number,
    success: boolean,
    error?: StandardError
  ): void {
    const sanitizedParams = maskSensitiveData(params, this.config.sensitiveFields);

    const callLog: ApiCallLog = {
      endpoint,
      method: 'GET',
      params: sanitizedParams,
      responseTime,
      success,
      error,
      timestamp: new Date().toISOString(),
      requestId
    };

    if (success) {
      this.info('API 호출 완료', {
        type: 'api_call_success',
        ...callLog
      });
    } else {
      this.error('API 호출 실패', error as any, {
        type: 'api_call_error',
        ...callLog
      });
    }
  }

  /**
   * 구조화된 에러를 로깅합니다
   * @param error 에러 정보
   * @param context 컨텍스트 정보
   */
  logStructuredError(error: StandardError, context?: Record<string, any>): void {
    const severity = determineSeverity(error);
    const sanitizedContext = context ? maskSensitiveData(context, this.config.sensitiveFields) : {};

    const errorLog: ErrorLog = {
      error,
      context: sanitizedContext,
      timestamp: new Date().toISOString(),
      severity
    };

    const message = `[${severity.toUpperCase()}] ${error.message}`;

    if (severity === 'critical' || severity === 'high') {
      this.error(message, undefined, {
        type: 'structured_error',
        ...errorLog
      });
    } else if (severity === 'medium') {
      this.warn(message, {
        type: 'structured_error',
        ...errorLog
      });
    } else {
      this.info(message, {
        type: 'structured_error',
        ...errorLog
      });
    }
  }

  /**
   * API 사용량 통계를 로깅합니다
   * @param apiUsage 사용량 통계
   * @param context 추가 컨텍스트
   */
  logUsageStats(apiUsage: ApiUsageStats, context?: {
    endpoint?: string;
    toolName?: string;
    userAgent?: string;
  }): void {
    const usageLog: UsageStatsLog = {
      apiUsage,
      ...context,
      timestamp: new Date().toISOString()
    };

    const percentage = (apiUsage.dailyCount / apiUsage.dailyLimit) * 100;
    const message = `API 사용량: ${apiUsage.dailyCount}/${apiUsage.dailyLimit} (${percentage.toFixed(1)}%)`;

    if (percentage >= 90) {
      this.warn(message, {
        type: 'usage_stats',
        level: 'warning',
        ...usageLog
      });
    } else if (percentage >= 75) {
      this.info(message, {
        type: 'usage_stats',
        level: 'notice',
        ...usageLog
      });
    } else {
      this.debug(message, {
        type: 'usage_stats',
        level: 'normal',
        ...usageLog
      });
    }
  }

  /**
   * MCP 도구 호출을 로깅합니다
   * @param toolName 도구 이름
   * @param input 입력 파라미터
   * @param success 성공 여부
   * @param responseTime 응답 시간
   * @param error 에러 정보 (실패 시)
   */
  logToolCall(
    toolName: string,
    input: Record<string, any>,
    success: boolean,
    responseTime: number,
    error?: StandardError
  ): void {
    const sanitizedInput = maskSensitiveData(input, this.config.sensitiveFields);

    const logData = {
      type: 'mcp_tool_call',
      toolName,
      input: sanitizedInput,
      success,
      responseTime,
      timestamp: new Date().toISOString(),
      error
    };

    if (success) {
      this.info(`MCP 도구 호출 성공: ${toolName}`, logData);
    } else {
      this.error(`MCP 도구 호출 실패: ${toolName}`, error as any, logData);
    }
  }

  /**
   * 서버 상태를 로깅합니다
   * @param status 서버 상태 정보
   */
  logServerStatus(status: {
    isHealthy: boolean;
    uptime: number;
    memoryUsage?: NodeJS.MemoryUsage;
    cpuUsage?: NodeJS.CpuUsage;
  }): void {
    const message = `서버 상태: ${status.isHealthy ? '정상' : '이상'}`;

    this.info(message, {
      type: 'server_status',
      ...status,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 성능 메트릭을 로깅합니다
   * @param operation 작업 이름
   * @param duration 소요 시간 (ms)
   * @param metadata 추가 메타데이터
   */
  logPerformanceMetric(
    operation: string,
    duration: number,
    metadata?: Record<string, any>
  ): void {
    const sanitizedMetadata = metadata ? maskSensitiveData(metadata, this.config.sensitiveFields) : {};

    this.debug(`성능 메트릭: ${operation}`, {
      type: 'performance_metric',
      operation,
      duration,
      ...sanitizedMetadata,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 로거 설정을 업데이트합니다
   * @param newConfig 새로운 설정
   */
  updateConfig(newConfig: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...newConfig };
    // 새 설정으로 로거 재생성
    this.logger.close();
    this.logger = this.createWinstonLogger();
  }

  /**
   * 로거를 종료합니다
   */
  close(): void {
    this.logger.close();
  }
}

// ===== 싱글톤 로거 인스턴스 =====

/**
 * 기본 로거 인스턴스 (싱글톤)
 */
let defaultLogger: AladinLogger | null = null;

/**
 * 기본 로거 인스턴스를 가져옵니다
 * @param config 로거 설정 (첫 번째 호출 시에만 적용)
 * @returns 로거 인스턴스
 */
export function getLogger(config?: Partial<LoggerConfig>): AladinLogger {
  if (!defaultLogger) {
    defaultLogger = new AladinLogger(config);
  }
  return defaultLogger;
}

/**
 * 로거 인스턴스를 초기화합니다
 * @param config 로거 설정
 * @returns 새 로거 인스턴스
 */
export function initializeLogger(config?: Partial<LoggerConfig>): AladinLogger {
  if (defaultLogger) {
    defaultLogger.close();
  }
  defaultLogger = new AladinLogger(config);
  return defaultLogger;
}

// ===== 편의 함수들 =====

/**
 * 디버그 로그 (편의 함수)
 */
export function debug(message: string, meta?: Record<string, any>): void {
  getLogger().debug(message, meta);
}

/**
 * 정보 로그 (편의 함수)
 */
export function info(message: string, meta?: Record<string, any>): void {
  getLogger().info(message, meta);
}

/**
 * 경고 로그 (편의 함수)
 */
export function warn(message: string, meta?: Record<string, any>): void {
  getLogger().warn(message, meta);
}

/**
 * 에러 로그 (편의 함수)
 */
export function error(message: string, error?: Error | StandardError, meta?: Record<string, any>): void {
  getLogger().error(message, error, meta);
}

/**
 * API 호출 로깅 (편의 함수)
 */
export function logApiCall(endpoint: string, params: Record<string, any>): string {
  return getLogger().logApiCallStart(endpoint, params);
}

/**
 * 에러 로깅 (편의 함수)
 */
export function logError(error: StandardError, context?: Record<string, any>): void {
  getLogger().logStructuredError(error, context);
}

/**
 * 사용량 통계 로깅 (편의 함수)
 */
export function logUsage(apiUsage: ApiUsageStats, context?: Record<string, any>): void {
  getLogger().logUsageStats(apiUsage, context);
}