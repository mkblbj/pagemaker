import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import axios from 'axios'

// Mock console
const consoleSpy = {
  log: vi.spyOn(console, 'log').mockImplementation(() => {}),
  warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
  error: vi.spyOn(console, 'error').mockImplementation(() => {})
}

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}

// Mock window.location
const mockLocation = {
  href: ''
}

// Mock axios
vi.mock('axios', () => ({
  default: {
    create: vi.fn()
  }
}))

describe('apiClient', () => {
  let mockAxiosInstance: any

  beforeEach(() => {
    vi.clearAllMocks()

    // Create fresh mock instance
    mockAxiosInstance = {
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() }
      },
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn()
    }

    // Setup axios.create to return our mock
    ;(axios.create as any).mockReturnValue(mockAxiosInstance)

    // Setup window mocks
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true
    })

    Object.defineProperty(window, 'location', {
      value: mockLocation,
      writable: true
    })
  })

  afterEach(() => {
    Object.values(consoleSpy).forEach(spy => spy.mockClear())
  })

  describe('apiClient creation', () => {
    it('应该创建axios实例', async () => {
      // Dynamic import after mocks are set up
      await import('./apiClient')

      expect(axios.create).toHaveBeenCalled()
    })
  })

  describe('createRetryApiClient', () => {
    it('应该创建重试客户端', async () => {
      const { createRetryApiClient } = await import('./apiClient')
      const client = createRetryApiClient()

      expect(client.get).toBeDefined()
      expect(client.post).toBeDefined()
      expect(client.put).toBeDefined()
      expect(client.patch).toBeDefined()
      expect(client.delete).toBeDefined()
    })
  })
})
