import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { smartRetry, RetryOptions, shouldRetryError } from './retryUtils'

// 调试：打印API基础URL
console.log('API Base URL:', process.env.NEXT_PUBLIC_API_URL)

// 创建axios实例
export const apiClient: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器 - 添加JWT token和调试信息
apiClient.interceptors.request.use(
  config => {
    // 调试：打印完整请求URL
    const fullURL = `${config.baseURL}${config.url}`
    console.log('Full Request URL:', fullURL)

    // 从localStorage获取token
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token')
      console.log('Access Token:', token ? 'Found' : 'Not found')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
        console.log('Authorization header set')
      } else {
        console.log('No token found in localStorage')
      }
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器 - 处理认证错误
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response
  },
  error => {
    if (error.response?.status === 401) {
      // Token过期或无效，清除本地存储并重定向到登录页
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// 创建带重试的 API 客户端
export const createRetryApiClient = (retryOptions: RetryOptions = {}) => {
  const defaultRetryOptions: RetryOptions = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffFactor: 2,
    retryCondition: error => {
      // 401 错误不重试，直接跳转登录
      if (error.response?.status === 401) {
        return false
      }
      return shouldRetryError(error)
    },
    onRetry: (error, attempt) => {
      console.warn(`API 请求失败，进行第 ${attempt} 次重试:`, error.message)
    },
    onMaxRetriesExceeded: error => {
      console.error('API 请求达到最大重试次数:', error)
    }
  }

  const options = { ...defaultRetryOptions, ...retryOptions }

  return {
    get: <T = any>(url: string, config?: AxiosRequestConfig) =>
      smartRetry(() => apiClient.get<T>(url, config), options),

    post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) =>
      smartRetry(() => apiClient.post<T>(url, data, config), options),

    put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) =>
      smartRetry(() => apiClient.put<T>(url, data, config), options),

    patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) =>
      smartRetry(() => apiClient.patch<T>(url, data, config), options),

    delete: <T = any>(url: string, config?: AxiosRequestConfig) =>
      smartRetry(() => apiClient.delete<T>(url, config), options)
  }
}

// 默认的重试 API 客户端
export const retryApiClient = createRetryApiClient()

export default apiClient
