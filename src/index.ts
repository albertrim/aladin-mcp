/**
 * 알라딘 OpenAPI MCP 서버
 *
 * 알라딘 API를 활용한 도서 정보 조회를 위한 MCP(Model Context Protocol) 서버입니다.
 * Claude Desktop과 연동하여 도서 검색, 상세 정보 조회, 베스트셀러/신간 목록 등의 기능을 제공합니다.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  CallToolRequest,
  CallToolResult,
  ListToolsRequestSchema,
  InitializeRequestSchema,
  InitializeRequest
} from '@modelcontextprotocol/sdk/types.js';
import dotenv from 'dotenv';

// MCP 도구들 import
import {
  handleAladinSearch,
  ALADIN_SEARCH_TOOL
} from './tools/aladin_search.js';
import {
  handleAladinBookInfo,
  ALADIN_BOOK_INFO_TOOL
} from './tools/aladin_book_info.js';
import {
  handleAladinBestsellers,
  ALADIN_BESTSELLERS_TOOL
} from './tools/aladin_bestsellers.js';
import {
  handleAladinNewBooks,
  ALADIN_NEW_BOOKS_TOOL
} from './tools/aladin_new_books.js';
import {
  handleAladinItemList,
  ALADIN_ITEM_LIST_TOOL
} from './tools/aladin_item_list.js';
import {
  handleAladinCategories,
  ALADIN_CATEGORIES_TOOL
} from './tools/aladin_categories.js';

// 유틸리티 import
import { getLogger, initializeLogger } from './utils/logger.js';
import type { StandardError } from './types.js';

// 환경변수 로드 (MCP에서는 stdout이 JSON 전용이므로 조용하게 로드)
// dotenv의 모든 출력을 억제
const originalConsole = console.log;
console.log = () => {}; // 임시로 console.log 비활성화
dotenv.config({ debug: false });
console.log = originalConsole; // console.log 복원

// ===== 서버 설정 =====

/**
 * MCP 서버 메타데이터
 */
const SERVER_INFO = {
  name: 'aladin-mcp-server',
  version: '1.0.0',
  description: '알라딘 OpenAPI용 MCP 서버 - 도서 정보 조회 및 검색 기능 제공',
  author: 'Albert Rim',
  homepage: 'https://github.com/albertrim/aladin-mcp'
};

/**
 * 등록된 MCP 도구들의 메타데이터
 */
const REGISTERED_TOOLS = [
  ALADIN_SEARCH_TOOL,
  ALADIN_BOOK_INFO_TOOL,
  ALADIN_BESTSELLERS_TOOL,
  ALADIN_NEW_BOOKS_TOOL,
  ALADIN_ITEM_LIST_TOOL,
  ALADIN_CATEGORIES_TOOL
];

/**
 * 도구 핸들러 매핑
 */
const TOOL_HANDLERS = {
  [ALADIN_SEARCH_TOOL.name]: handleAladinSearch,
  [ALADIN_BOOK_INFO_TOOL.name]: handleAladinBookInfo,
  [ALADIN_BESTSELLERS_TOOL.name]: handleAladinBestsellers,
  [ALADIN_NEW_BOOKS_TOOL.name]: handleAladinNewBooks,
  [ALADIN_ITEM_LIST_TOOL.name]: handleAladinItemList,
  [ALADIN_CATEGORIES_TOOL.name]: handleAladinCategories
};

// ===== 서버 클래스 =====

/**
 * 알라딘 MCP 서버 클래스
 */
class AladinMcpServer {
  private server: Server;
  private logger: ReturnType<typeof getLogger>;
  private isShuttingDown = false;
  private startTime: Date;

  constructor() {
    this.startTime = new Date();

    // 로거 초기화 (MCP 서버는 stdout을 JSON-RPC 통신용으로만 사용)
    this.logger = initializeLogger({
      level: (process.env.LOG_LEVEL as any) || 'info',
      enableConsole: false, // MCP 서버에서는 콘솔 출력 비활성화
      enableFile: true
    });

    // MCP 서버 인스턴스 생성
    this.server = new Server(SERVER_INFO, {
      capabilities: {
        tools: {}
      }
    });

    this.logger.info('알라딘 MCP 서버 초기화 시작', SERVER_INFO);
    this.setupHandlers();
    this.setupProcessHandlers();
  }

  /**
   * MCP 서버 핸들러 설정
   */
  private setupHandlers(): void {
    // 초기화 요청 핸들러
    this.server.setRequestHandler(InitializeRequestSchema, async (request: InitializeRequest) => {
      this.logger.info('MCP 초기화 요청 수신', {
        protocolVersion: request.params.protocolVersion,
        clientInfo: request.params.clientInfo
      });

      return {
        protocolVersion: '2025-06-18',
        serverInfo: SERVER_INFO,
        capabilities: {
          tools: {}
        }
      };
    });

    // 도구 목록 요청 핸들러
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      this.logger.debug('도구 목록 요청 수신');

      return {
        tools: REGISTERED_TOOLS.map(tool => ({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema
        }))
      };
    });

    // 도구 호출 요청 핸들러
    this.server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest): Promise<CallToolResult> => {
      const { name, arguments: args } = request.params;
      const startTime = Date.now();

      this.logger.info('MCP 도구 호출 요청', { toolName: name, args });

      try {
        // 도구 핸들러 확인
        const handler = TOOL_HANDLERS[name];
        if (!handler) {
          const error: StandardError = {
            code: 300 as import('./types.js').ErrorCode,
            message: `알 수 없는 도구입니다: ${name}`,
            timestamp: new Date().toISOString()
          };

          this.logger.warn('알 수 없는 도구 호출 시도', { toolName: name });

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: false,
                  error
                }, null, 2)
              }
            ]
          };
        }

        // 입력값 검증 및 도구 실행
        const result = await handler(args as any);
        const endTime = Date.now();

        this.logger.logToolCall(
          name,
          args || {},
          result.success,
          endTime - startTime,
          result.success ? undefined : result.error
        );

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };

      } catch (error: any) {
        const endTime = Date.now();

        this.logger.error('MCP 도구 실행 중 오류 발생', error, {
          toolName: name,
          args,
          responseTime: endTime - startTime
        });

        const standardError: StandardError = {
          code: 900 as import('./types.js').ErrorCode,
          message: `도구 실행 중 오류가 발생했습니다: ${error.message}`,
          timestamp: new Date().toISOString()
        };

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: false,
                error: standardError
              }, null, 2)
            }
          ]
        };
      }
    });

    this.logger.info('MCP 서버 핸들러 설정 완료', {
      registeredTools: REGISTERED_TOOLS.length,
      toolNames: REGISTERED_TOOLS.map(t => t.name)
    });
  }

  /**
   * 프로세스 신호 핸들러 설정
   */
  private setupProcessHandlers(): void {
    // Graceful shutdown 처리
    const shutdownHandler = (signal: string) => {
      this.logger.info(`${signal} 신호 수신, Graceful Shutdown 시작`);
      this.gracefulShutdown();
    };

    process.on('SIGINT', () => shutdownHandler('SIGINT'));
    process.on('SIGTERM', () => shutdownHandler('SIGTERM'));

    // 예외 처리
    process.on('uncaughtException', (error) => {
      this.logger.error('처리되지 않은 예외 발생', error);
      this.gracefulShutdown();
    });

    process.on('unhandledRejection', (reason, promise) => {
      this.logger.error('처리되지 않은 Promise 거부', new Error(String(reason)), {
        promise: promise.toString()
      });
    });

    this.logger.debug('프로세스 신호 핸들러 설정 완료');
  }

  /**
   * 환경변수 유효성 검증
   */
  private validateEnvironment(): boolean {
    const requiredEnvVars = ['TTB_KEY'];
    const missingVars: string[] = [];

    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        missingVars.push(envVar);
      }
    }

    if (missingVars.length > 0) {
      this.logger.error('필수 환경변수가 설정되지 않았습니다', undefined, {
        missingVars,
        help: '.env 파일을 확인하고 필수 환경변수를 설정해주세요.'
      });
      return false;
    }

    // TTB 키 형식 검증
    const ttbKey = process.env.TTB_KEY;
    if (ttbKey && !ttbKey.startsWith('ttb')) {
      this.logger.warn('TTB 키 형식이 올바르지 않을 수 있습니다', {
        hint: 'TTB 키는 일반적으로 "ttb"로 시작합니다.'
      });
    }

    this.logger.info('환경변수 검증 완료');
    return true;
  }

  /**
   * 서버 상태 헬스체크
   */
  private performHealthCheck(): void {
    const uptime = Date.now() - this.startTime.getTime();
    const memoryUsage = process.memoryUsage();

    this.logger.logServerStatus({
      isHealthy: true,
      uptime,
      memoryUsage
    });

    // 메모리 사용량 경고
    const memoryUsageMB = memoryUsage.heapUsed / 1024 / 1024;
    if (memoryUsageMB > 100) { // 100MB 이상 사용 시 경고
      this.logger.warn('높은 메모리 사용량 감지', {
        heapUsedMB: Math.round(memoryUsageMB),
        totalHeapMB: Math.round(memoryUsage.heapTotal / 1024 / 1024)
      });
    }
  }

  /**
   * 정기적인 상태 모니터링 시작
   */
  private startHealthMonitoring(): void {
    // 5분마다 헬스체크 수행
    const healthCheckInterval = setInterval(() => {
      if (!this.isShuttingDown) {
        this.performHealthCheck();
      } else {
        clearInterval(healthCheckInterval);
      }
    }, 5 * 60 * 1000);

    this.logger.debug('상태 모니터링 시작 (5분 간격)');
  }

  /**
   * 서버 시작
   */
  async start(): Promise<void> {
    try {
      // 환경변수 검증
      if (!this.validateEnvironment()) {
        process.exit(1);
      }

      // stdio 전송 설정
      const transport = new StdioServerTransport();

      this.logger.info('MCP 서버 시작 중...', {
        transport: 'stdio',
        tools: REGISTERED_TOOLS.length
      });

      // 서버 연결
      await this.server.connect(transport);

      // 초기 헬스체크
      this.performHealthCheck();

      // 정기 모니터링 시작
      this.startHealthMonitoring();

      this.logger.info('알라딘 MCP 서버가 성공적으로 시작되었습니다', {
        serverInfo: SERVER_INFO,
        availableTools: REGISTERED_TOOLS.map(t => t.name),
        pid: process.pid,
        nodeVersion: process.version,
        platform: process.platform
      });

    } catch (error: any) {
      this.logger.error('MCP 서버 시작 실패', error);
      process.exit(1);
    }
  }

  /**
   * Graceful shutdown 처리
   */
  private async gracefulShutdown(): Promise<void> {
    if (this.isShuttingDown) {
      this.logger.warn('이미 종료 중입니다');
      return;
    }

    this.isShuttingDown = true;
    const shutdownStartTime = Date.now();

    this.logger.info('Graceful Shutdown 시작');

    try {
      // 서버 연결 종료
      await this.server.close();

      // 로거 종료
      this.logger.close();

      const shutdownTime = Date.now() - shutdownStartTime;
      console.error(`알라딘 MCP 서버가 정상적으로 종료되었습니다 (${shutdownTime}ms)`);

      process.exit(0);
    } catch (error: any) {
      console.error('Graceful Shutdown 실패:', error);
      process.exit(1);
    }
  }
}

// ===== 서버 실행 =====

/**
 * 메인 실행 함수
 */
async function main(): Promise<void> {
  try {
    const server = new AladinMcpServer();
    await server.start();
  } catch (error: any) {
    console.error('알라딘 MCP 서버 실행 실패:', error);
    process.exit(1);
  }
}

// ESM 환경에서 직접 실행 시에만 서버 시작
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('예기치 않은 오류:', error);
    process.exit(1);
  });
}

export { AladinMcpServer, main };