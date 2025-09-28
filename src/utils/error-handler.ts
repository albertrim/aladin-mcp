/**
 * 에러 처리 및 관리 유틸리티
 *
 * 알라딘 API의 특화된 에러 처리 시스템을 제공합니다.
 * - 알라딘 API 에러 코드 매핑
 * - 네트워크 에러 처리
 * - 파라미터 검증 에러
 * - MCP 프로토콜 에러 변환
 * - 사용자 친화적인 한국어 에러 메시지
 */

import type {
  StandardError,
  AladinApiError,
  ValidationResult,
  ApiUsageStats
} from '../types.js';
import { ErrorCode } from '../types.js';
import { ERROR_MESSAGES, CLIENT_ERROR_MESSAGES } from '../constants/api.js';
import { getLogger } from './logger.js';

// ===== 에러 분류 및 심각도 관리 =====

/**
 * 에러 심각도 레벨
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * 에러 카테고리
 */
export enum ErrorCategory {
  AUTHENTICATION = 'authentication',    // TTB 키 관련 에러
  PARAMETER = 'parameter',              // 파라미터 검증 에러
  RATE_LIMIT = 'rate_limit',            // 호출 한도 초과
  NETWORK = 'network',                  // 네트워크 관련 에러
  API_RESPONSE = 'api_response',        // API 응답 에러
  SYSTEM = 'system',                    // 시스템 에러
  VALIDATION = 'validation',            // 입력값 검증 에러
  MCP_PROTOCOL = 'mcp_protocol'         // MCP 프로토콜 에러
}

/**
 * 알라딘 API 에러 코드 상세 정보
 */
export const ALADIN_ERROR_DETAILS = {
  100: {
    category: ErrorCategory.AUTHENTICATION,
    severity: ErrorSeverity.HIGH,
    isRetryable: false,
    message: '잘못된 TTB 키입니다. API 키를 확인해 주세요.',
    suggestion: 'TTB 키가 올바른지 확인하고, 알라딘에서 발급받은 정확한 키를 사용해 주세요.'
  },
  200: {
    category: ErrorCategory.PARAMETER,
    severity: ErrorSeverity.MEDIUM,
    isRetryable: false,
    message: '필수 파라미터가 누락되었습니다.',
    suggestion: '요청에 필요한 모든 필수 파라미터를 포함해 주세요.'
  },
  300: {
    category: ErrorCategory.PARAMETER,
    severity: ErrorSeverity.MEDIUM,
    isRetryable: false,
    message: '잘못된 파라미터 값입니다.',
    suggestion: '파라미터 값의 형식과 범위를 확인해 주세요.'
  },
  900: {
    category: ErrorCategory.SYSTEM,
    severity: ErrorSeverity.HIGH,
    isRetryable: true,
    message: '시스템 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
    suggestion: '일시적인 서버 오류일 수 있습니다. 잠시 기다린 후 다시 요청해 주세요.'
  },
  901: {
    category: ErrorCategory.RATE_LIMIT,
    severity: ErrorSeverity.CRITICAL,
    isRetryable: false,
    message: '일일 호출 한도(5,000회)를 초과했습니다. 내일 다시 시도해 주세요.',
    suggestion: 'API 사용량을 확인하고 내일 다시 시도해 주세요. 필요시 추가 키를 발급받아 사용하세요.'
  }
} as const;

/**
 * 네트워크 에러 코드 매핑
 */
export const NETWORK_ERROR_MAPPING = {
  'ECONNREFUSED': {
    category: ErrorCategory.NETWORK,
    severity: ErrorSeverity.HIGH,
    isRetryable: true,
    message: '서버에 연결할 수 없습니다.',
    suggestion: '네트워크 연결을 확인하고 잠시 후 다시 시도해 주세요.'
  },
  'ENOTFOUND': {
    category: ErrorCategory.NETWORK,
    severity: ErrorSeverity.HIGH,
    isRetryable: true,
    message: '서버를 찾을 수 없습니다.',
    suggestion: '인터넷 연결을 확인하고 DNS 설정을 점검해 주세요.'
  },
  'ECONNABORTED': {
    category: ErrorCategory.NETWORK,
    severity: ErrorSeverity.MEDIUM,
    isRetryable: true,
    message: '요청 시간이 초과되었습니다.',
    suggestion: '네트워크 상태를 확인하고 다시 시도해 주세요.'
  },
  'ETIMEDOUT': {
    category: ErrorCategory.NETWORK,
    severity: ErrorSeverity.MEDIUM,
    isRetryable: true,
    message: '요청 시간이 초과되었습니다.',
    suggestion: '서버 응답이 지연되고 있습니다. 잠시 후 다시 시도해 주세요.'
  }
} as const;

/**
 * HTTP 상태 코드별 에러 처리
 */
export const HTTP_STATUS_ERROR_MAPPING = {
  400: {
    category: ErrorCategory.PARAMETER,
    severity: ErrorSeverity.MEDIUM,
    isRetryable: false,
    message: '잘못된 요청입니다.',
    suggestion: '요청 파라미터를 확인해 주세요.'
  },
  401: {
    category: ErrorCategory.AUTHENTICATION,
    severity: ErrorSeverity.HIGH,
    isRetryable: false,
    message: '인증에 실패했습니다.',
    suggestion: 'TTB 키를 확인해 주세요.'
  },
  403: {
    category: ErrorCategory.AUTHENTICATION,
    severity: ErrorSeverity.HIGH,
    isRetryable: false,
    message: '접근이 거부되었습니다.',
    suggestion: 'API 사용 권한을 확인해 주세요.'
  },
  404: {
    category: ErrorCategory.API_RESPONSE,
    severity: ErrorSeverity.MEDIUM,
    isRetryable: false,
    message: '요청한 리소스를 찾을 수 없습니다.',
    suggestion: '요청 URL과 파라미터를 확인해 주세요.'
  },
  429: {
    category: ErrorCategory.RATE_LIMIT,
    severity: ErrorSeverity.HIGH,
    isRetryable: true,
    message: 'API 호출 빈도 제한을 초과했습니다.',
    suggestion: '잠시 후 다시 시도해 주세요.'
  },
  500: {
    category: ErrorCategory.SYSTEM,
    severity: ErrorSeverity.HIGH,
    isRetryable: true,
    message: '서버 내부 오류가 발생했습니다.',
    suggestion: '서버에 일시적인 문제가 있습니다. 잠시 후 다시 시도해 주세요.'
  },
  502: {
    category: ErrorCategory.NETWORK,
    severity: ErrorSeverity.HIGH,
    isRetryable: true,
    message: '게이트웨이 오류가 발생했습니다.',
    suggestion: '서버 연결에 문제가 있습니다. 잠시 후 다시 시도해 주세요.'
  },
  503: {
    category: ErrorCategory.SYSTEM,
    severity: ErrorSeverity.HIGH,
    isRetryable: true,
    message: '서비스를 사용할 수 없습니다.',
    suggestion: '서버가 일시적으로 과부하 상태입니다. 잠시 후 다시 시도해 주세요.'
  },
  504: {
    category: ErrorCategory.NETWORK,
    severity: ErrorSeverity.HIGH,
    isRetryable: true,
    message: '게이트웨이 시간 초과가 발생했습니다.',
    suggestion: '서버 응답이 지연되고 있습니다. 잠시 후 다시 시도해 주세요.'
  }
} as const;

// ===== 에러 처리 클래스 =====

/**
 * 강화된 에러 처리 관리자
 */
export class AladinErrorHandler {
  private logger = getLogger();
  private errorMetrics = new Map<string, number>();

  /**
   * 알라딘 API 에러를 표준 에러로 변환
   */
  handleAladinApiError(apiError: AladinApiError): StandardError {
    const errorCode = apiError.errorCode as ErrorCode;
    const errorDetail = ALADIN_ERROR_DETAILS[errorCode];

    if (!errorDetail) {
      // 알 수 없는 에러 코드
      this.logger.warn('알 수 없는 알라딘 API 에러 코드', {
        errorCode: apiError.errorCode,
        errorMessage: apiError.errorMessage
      });

      return this.createStandardError(
        ErrorCode.SYSTEM_ERROR,
        apiError.errorMessage || '알 수 없는 API 오류가 발생했습니다.',
        apiError
      );
    }

    const standardError = this.createStandardError(
      errorCode,
      errorDetail.message,
      apiError
    );

    // 에러 메트릭 업데이트
    this.updateErrorMetrics(errorDetail.category, errorDetail.severity);

    // 로깅
    this.logger.logStructuredError(standardError, {
      category: errorDetail.category,
      severity: errorDetail.severity,
      isRetryable: errorDetail.isRetryable,
      suggestion: errorDetail.suggestion
    });

    return standardError;
  }

  /**
   * 네트워크 에러 처리
   */
  handleNetworkError(error: any): StandardError {
    const errorCode = error.code;
    const networkError = NETWORK_ERROR_MAPPING[errorCode as keyof typeof NETWORK_ERROR_MAPPING];

    if (networkError) {
      const standardError = this.createStandardError(
        ErrorCode.SYSTEM_ERROR,
        networkError.message,
        error
      );

      this.updateErrorMetrics(networkError.category, networkError.severity);

      this.logger.logStructuredError(standardError, {
        category: networkError.category,
        severity: networkError.severity,
        isRetryable: networkError.isRetryable,
        suggestion: networkError.suggestion,
        networkErrorCode: errorCode
      });

      return standardError;
    }

    // 기본 네트워크 에러 처리
    return this.createStandardError(
      ErrorCode.SYSTEM_ERROR,
      '네트워크 연결에 실패했습니다.',
      error
    );
  }

  /**
   * HTTP 상태 코드 에러 처리
   */
  handleHttpStatusError(statusCode: number, responseData?: any): StandardError {
    const httpError = HTTP_STATUS_ERROR_MAPPING[statusCode as keyof typeof HTTP_STATUS_ERROR_MAPPING];

    if (httpError) {
      let errorCode: ErrorCode;

      switch (httpError.category) {
        case ErrorCategory.AUTHENTICATION:
          errorCode = ErrorCode.INVALID_TTB_KEY;
          break;
        case ErrorCategory.PARAMETER:
          errorCode = ErrorCode.INVALID_PARAM_VALUE;
          break;
        case ErrorCategory.RATE_LIMIT:
          errorCode = ErrorCode.DAILY_LIMIT_EXCEEDED;
          break;
        default:
          errorCode = ErrorCode.SYSTEM_ERROR;
      }

      const standardError = this.createStandardError(
        errorCode,
        httpError.message,
        responseData
      );

      this.updateErrorMetrics(httpError.category, httpError.severity);

      this.logger.logStructuredError(standardError, {
        category: httpError.category,
        severity: httpError.severity,
        isRetryable: httpError.isRetryable,
        suggestion: httpError.suggestion,
        httpStatusCode: statusCode
      });

      return standardError;
    }

    // 기본 HTTP 에러 처리
    return this.createStandardError(
      ErrorCode.SYSTEM_ERROR,
      `HTTP ${statusCode} 오류가 발생했습니다.`,
      responseData
    );
  }

  /**
   * 파라미터 검증 에러 처리
   */
  handleValidationError(validation: ValidationResult): StandardError {
    const errorMessage = validation.errors.join(', ');

    const standardError = this.createStandardError(
      ErrorCode.INVALID_PARAM_VALUE,
      errorMessage
    );

    this.updateErrorMetrics(ErrorCategory.VALIDATION, ErrorSeverity.MEDIUM);

    this.logger.logStructuredError(standardError, {
      category: ErrorCategory.VALIDATION,
      severity: ErrorSeverity.MEDIUM,
      isRetryable: false,
      validationErrors: validation.errors
    });

    return standardError;
  }

  /**
   * MCP 프로토콜 에러 처리
   */
  handleMcpProtocolError(toolName: string, error: any): StandardError {
    const errorMessage = `MCP 도구 '${toolName}' 호출 중 오류가 발생했습니다: ${error.message || error}`;

    const standardError = this.createStandardError(
      ErrorCode.SYSTEM_ERROR,
      errorMessage,
      error
    );

    this.updateErrorMetrics(ErrorCategory.MCP_PROTOCOL, ErrorSeverity.HIGH);

    this.logger.logStructuredError(standardError, {
      category: ErrorCategory.MCP_PROTOCOL,
      severity: ErrorSeverity.HIGH,
      isRetryable: false,
      toolName,
      originalError: error
    });

    return standardError;
  }

  /**
   * API 사용량 한도 초과 에러 처리
   */
  handleApiLimitExceeded(usage: ApiUsageStats): StandardError {
    const standardError = this.createStandardError(
      ErrorCode.DAILY_LIMIT_EXCEEDED,
      `일일 API 호출 한도(${usage.dailyLimit}회)를 초과했습니다. 현재 사용량: ${usage.dailyCount}회`
    );

    this.updateErrorMetrics(ErrorCategory.RATE_LIMIT, ErrorSeverity.CRITICAL);

    this.logger.logStructuredError(standardError, {
      category: ErrorCategory.RATE_LIMIT,
      severity: ErrorSeverity.CRITICAL,
      isRetryable: false,
      suggestion: '내일 다시 시도하거나 추가 API 키를 발급받아 사용해 주세요.',
      apiUsage: usage
    });

    return standardError;
  }

  /**
   * TTB 키 유효성 검사 에러 처리
   */
  handleInvalidTtbKey(ttbKey: string): StandardError {
    const standardError = this.createStandardError(
      ErrorCode.INVALID_TTB_KEY,
      'TTB 키가 유효하지 않습니다.'
    );

    this.updateErrorMetrics(ErrorCategory.AUTHENTICATION, ErrorSeverity.HIGH);

    this.logger.logStructuredError(standardError, {
      category: ErrorCategory.AUTHENTICATION,
      severity: ErrorSeverity.HIGH,
      isRetryable: false,
      suggestion: '알라딘에서 발급받은 정확한 TTB 키를 사용해 주세요.',
      ttbKeyPattern: ttbKey.substring(0, 6) + '***' // 보안을 위해 일부만 로깅
    });

    return standardError;
  }

  /**
   * 일반적인 예외 처리
   */
  handleGenericError(error: any, context?: string): StandardError {
    const errorMessage = context
      ? `${context}: ${error.message || error}`
      : error.message || error.toString();

    const standardError = this.createStandardError(
      ErrorCode.SYSTEM_ERROR,
      errorMessage,
      error
    );

    this.updateErrorMetrics(ErrorCategory.SYSTEM, ErrorSeverity.MEDIUM);

    this.logger.logStructuredError(standardError, {
      category: ErrorCategory.SYSTEM,
      severity: ErrorSeverity.MEDIUM,
      isRetryable: false,
      context,
      originalError: error
    });

    return standardError;
  }

  /**
   * 표준 에러 객체 생성
   */
  private createStandardError(
    code: ErrorCode,
    message: string,
    originalError?: any
  ): StandardError {
    return {
      code,
      message,
      originalError,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 에러 메트릭 업데이트
   */
  private updateErrorMetrics(category: ErrorCategory, severity: ErrorSeverity): void {
    const key = `${category}:${severity}`;
    const currentCount = this.errorMetrics.get(key) || 0;
    this.errorMetrics.set(key, currentCount + 1);
  }

  /**
   * 에러 재시도 가능 여부 확인
   */
  isRetryableError(error: StandardError): boolean {
    const errorDetail = ALADIN_ERROR_DETAILS[error.code];
    if (errorDetail) {
      return errorDetail.isRetryable;
    }

    // 기본적으로 시스템 에러는 재시도 가능
    return error.code === ErrorCode.SYSTEM_ERROR;
  }

  /**
   * 에러 심각도 확인
   */
  getErrorSeverity(error: StandardError): ErrorSeverity {
    const errorDetail = ALADIN_ERROR_DETAILS[error.code];
    return errorDetail?.severity || ErrorSeverity.MEDIUM;
  }

  /**
   * 에러 카테고리 확인
   */
  getErrorCategory(error: StandardError): ErrorCategory {
    const errorDetail = ALADIN_ERROR_DETAILS[error.code];
    return errorDetail?.category || ErrorCategory.SYSTEM;
  }

  /**
   * 에러 메트릭 조회
   */
  getErrorMetrics(): Map<string, number> {
    return new Map(this.errorMetrics);
  }

  /**
   * 에러 메트릭 초기화
   */
  resetErrorMetrics(): void {
    this.errorMetrics.clear();
  }

  /**
   * 사용자 친화적인 에러 메시지 생성
   */
  getUserFriendlyMessage(error: StandardError): string {
    const errorDetail = ALADIN_ERROR_DETAILS[error.code];
    if (errorDetail?.suggestion) {
      return `${error.message}\n\n해결 방법: ${errorDetail.suggestion}`;
    }
    return error.message;
  }
}

// ===== 싱글톤 인스턴스 및 편의 함수 =====

/**
 * 기본 에러 핸들러 인스턴스
 */
let defaultErrorHandler: AladinErrorHandler | null = null;

/**
 * 기본 에러 핸들러 인스턴스 조회
 */
export function getErrorHandler(): AladinErrorHandler {
  if (!defaultErrorHandler) {
    defaultErrorHandler = new AladinErrorHandler();
  }
  return defaultErrorHandler;
}

/**
 * 알라딘 API 에러 처리 (편의 함수)
 */
export function handleAladinApiError(apiError: AladinApiError): StandardError {
  return getErrorHandler().handleAladinApiError(apiError);
}

/**
 * 네트워크 에러 처리 (편의 함수)
 */
export function handleNetworkError(error: any): StandardError {
  return getErrorHandler().handleNetworkError(error);
}

/**
 * HTTP 상태 에러 처리 (편의 함수)
 */
export function handleHttpStatusError(statusCode: number, responseData?: any): StandardError {
  return getErrorHandler().handleHttpStatusError(statusCode, responseData);
}

/**
 * 검증 에러 처리 (편의 함수)
 */
export function handleValidationError(validation: ValidationResult): StandardError {
  return getErrorHandler().handleValidationError(validation);
}

/**
 * MCP 프로토콜 에러 처리 (편의 함수)
 */
export function handleMcpProtocolError(toolName: string, error: any): StandardError {
  return getErrorHandler().handleMcpProtocolError(toolName, error);
}

/**
 * 일반 에러 처리 (편의 함수)
 */
export function handleGenericError(error: any, context?: string): StandardError {
  return getErrorHandler().handleGenericError(error, context);
}