/**
 * 网络重试工具类
 * 支持指数退避、最大重试次数、错误分类等功能
 */

export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  retryCondition?: (error: any) => boolean;
  onRetry?: (error: any, attempt: number) => void;
  onMaxRetriesExceeded?: (error: any) => void;
}

export interface RetryState {
  attempt: number;
  totalAttempts: number;
  lastError: any;
  isRetrying: boolean;
}

export class RetryError extends Error {
  constructor(
    public originalError: any,
    public attempts: number,
    public maxRetries: number
  ) {
    super(`操作失败，已重试 ${attempts} 次，最大重试次数 ${maxRetries}`);
    this.name = 'RetryError';
  }
}

/**
 * 判断错误是否应该重试
 */
export function shouldRetryError(error: any): boolean {
  // 网络错误
  if (error.code === 'NETWORK_ERROR' || error.code === 'ECONNABORTED') {
    return true;
  }

  // HTTP状态码错误
  if (error.response?.status) {
    const status = error.response.status;
    // 5xx 服务器错误应该重试
    if (status >= 500 && status < 600) {
      return true;
    }
    // 429 请求过多应该重试
    if (status === 429) {
      return true;
    }
    // 408 请求超时应该重试
    if (status === 408) {
      return true;
    }
  }

  // 超时错误
  if (error.message?.includes('timeout') || error.code === 'TIMEOUT') {
    return true;
  }

  // 连接错误
  if (error.message?.includes('connection') || error.code === 'ECONNREFUSED') {
    return true;
  }

  return false;
}

/**
 * 计算重试延迟时间（指数退避）
 */
export function calculateRetryDelay(
  attempt: number,
  baseDelay: number = 1000,
  backoffFactor: number = 2,
  maxDelay: number = 30000
): number {
  const delay = baseDelay * Math.pow(backoffFactor, attempt - 1);
  return Math.min(delay, maxDelay);
}

/**
 * 添加随机抖动，避免惊群效应
 */
export function addJitter(delay: number, jitterFactor: number = 0.1): number {
  const jitter = delay * jitterFactor * Math.random();
  return delay + jitter;
}

/**
 * 延迟执行
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 重试执行异步函数
 */
export async function retryAsync<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 30000,
    backoffFactor = 2,
    retryCondition = shouldRetryError,
    onRetry,
    onMaxRetriesExceeded
  } = options;

  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // 如果是最后一次尝试，不再重试
      if (attempt > maxRetries) {
        onMaxRetriesExceeded?.(error);
        throw new RetryError(error, attempt - 1, maxRetries);
      }

      // 检查是否应该重试
      if (!retryCondition(error)) {
        throw error;
      }

      // 通知重试回调
      onRetry?.(error, attempt);

      // 计算延迟时间
      const retryDelay = calculateRetryDelay(attempt, baseDelay, backoffFactor, maxDelay);
      const delayWithJitter = addJitter(retryDelay);

      console.warn(`操作失败，${delayWithJitter}ms 后进行第 ${attempt} 次重试:`, error.message);

      // 等待后重试
      await delay(delayWithJitter);
    }
  }

  throw lastError;
}

/**
 * 创建具有重试功能的 fetch 函数
 */
export function createRetryFetch(options: RetryOptions = {}) {
  return async function retryFetch(url: string, init?: RequestInit): Promise<Response> {
    return retryAsync(
      async () => {
        const response = await fetch(url, init);
        
        // 检查响应状态
        if (!response.ok) {
          const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
          (error as any).response = response;
          throw error;
        }
        
        return response;
      },
      {
        ...options,
        retryCondition: (error) => {
          // 使用自定义重试条件或默认条件
          return options.retryCondition?.(error) ?? shouldRetryError(error);
        }
      }
    );
  };
}

/**
 * 重试状态管理 Hook 接口
 */
export interface UseRetryResult {
  retry: () => Promise<void>;
  isRetrying: boolean;
  retryCount: number;
  lastError: any;
  canRetry: boolean;
}

/**
 * 网络状态检测
 */
export function isOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

/**
 * 等待网络恢复
 */
export function waitForOnline(): Promise<void> {
  return new Promise((resolve) => {
    if (isOnline()) {
      resolve();
      return;
    }

    const handleOnline = () => {
      window.removeEventListener('online', handleOnline);
      resolve();
    };

    window.addEventListener('online', handleOnline);
  });
}

/**
 * 智能重试：考虑网络状态
 */
export async function smartRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  return retryAsync(
    async () => {
      // 如果网络离线，等待网络恢复
      if (!isOnline()) {
        console.log('网络离线，等待网络恢复...');
        await waitForOnline();
        console.log('网络已恢复，继续执行...');
      }
      
      return await fn();
    },
    {
      ...options,
      retryCondition: (error) => {
        // 如果是网络错误且当前在线，则重试
        if (!isOnline()) {
          return false; // 离线状态不重试，等待网络恢复
        }
        
        return options.retryCondition?.(error) ?? shouldRetryError(error);
      }
    }
  );
}

/**
 * 创建重试装饰器
 */
export function withRetry<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: RetryOptions = {}
): T {
  return (async (...args: any[]) => {
    return smartRetry(() => fn(...args), options);
  }) as T;
} 