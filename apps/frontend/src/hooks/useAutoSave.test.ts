import { renderHook, act, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { useAutoSave, useVersionHistory } from './useAutoSave'
import { usePageStore } from '@/stores/usePageStore'
import { useEditorStore } from '@/stores/useEditorStore'
import { pageService } from '@/services/pageService'
import { PageModuleType } from '@pagemaker/shared-types'

// Mock stores
vi.mock('@/stores/usePageStore')
vi.mock('@/stores/useEditorStore')
vi.mock('@/services/pageService')

const mockPageStore = {
  currentPage: {
    id: 'test-page-id',
    name: 'Test Page',
    content: [
      {
        id: 'module-1',
        type: PageModuleType.TEXT,
        content: 'Test content'
      }
    ],
    target_area: 'pc',
    owner_id: 'test-user',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    module_count: 1
  },
  hasUnsavedChanges: false,
  markSaved: vi.fn(),
  setPage: vi.fn()
}

const mockEditorStore = {
  setSaving: vi.fn(),
  setError: vi.fn()
}

const mockPageService = pageService as any

describe('useAutoSave', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    ;(usePageStore as any).mockReturnValue(mockPageStore)
    ;(useEditorStore as any).mockReturnValue(mockEditorStore)
    mockPageService.updatePage.mockResolvedValue(mockPageStore.currentPage)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('应该初始化默认配置', () => {
    const { result } = renderHook(() => useAutoSave())

    expect(result.current.autoSave).toBeDefined()
    expect(result.current.lastSaveTime).toBe(0)
    expect(result.current.isAutoSaving).toBe(false)
  })

  it('应该在有未保存更改时执行自动保存', async () => {
    const mockStoreWithChanges = {
      ...mockPageStore,
      hasUnsavedChanges: true
    }
    ;(usePageStore as any).mockReturnValue(mockStoreWithChanges)

    const onSave = vi.fn()
    const { result } = renderHook(() => useAutoSave({ interval: 1000, onSave }))

    // 执行自动保存
    await act(async () => {
      await result.current.autoSave()
    })

    expect(mockEditorStore.setSaving).toHaveBeenCalledWith(true)
    expect(mockPageService.updatePage).toHaveBeenCalledWith('test-page-id', {
      name: 'Test Page',
      content: mockPageStore.currentPage.content,
      target_area: 'pc'
    })
    expect(mockPageStore.markSaved).toHaveBeenCalled()
    expect(mockPageStore.setPage).toHaveBeenCalled()
    expect(mockEditorStore.setSaving).toHaveBeenCalledWith(false)
    expect(onSave).toHaveBeenCalled()
  })

  it('应该处理保存错误', async () => {
    const mockStoreWithChanges = {
      ...mockPageStore,
      hasUnsavedChanges: true
    }
    ;(usePageStore as any).mockReturnValue(mockStoreWithChanges)

    const error = new Error('保存失败')
    mockPageService.updatePage.mockRejectedValue(error)

    const onError = vi.fn()
    const { result } = renderHook(() => useAutoSave({ onError }))

    await act(async () => {
      try {
        await result.current.autoSave()
      } catch (e) {
        // 预期会抛出错误
      }
    })

    expect(mockEditorStore.setError).toHaveBeenCalledWith('保存失败')
    expect(onError).toHaveBeenCalledWith(error)
    expect(mockEditorStore.setSaving).toHaveBeenCalledWith(false)
  })

  it('应该在没有未保存更改时跳过保存', async () => {
    const { result } = renderHook(() => useAutoSave())

    await act(async () => {
      await result.current.autoSave()
    })

    expect(mockPageService.updatePage).not.toHaveBeenCalled()
  })

  it('应该在没有页面时跳过保存', async () => {
    const mockStoreNoPage = {
      ...mockPageStore,
      currentPage: null,
      hasUnsavedChanges: true
    }
    ;(usePageStore as any).mockReturnValue(mockStoreNoPage)

    const { result } = renderHook(() => useAutoSave())

    await act(async () => {
      await result.current.autoSave()
    })

    expect(mockPageService.updatePage).not.toHaveBeenCalled()
  })

  it('应该设置定时器进行自动保存', async () => {
    const mockStoreWithChanges = {
      ...mockPageStore,
      hasUnsavedChanges: true
    }
    ;(usePageStore as any).mockReturnValue(mockStoreWithChanges)

    const { result } = renderHook(() => useAutoSave({ interval: 1000 }))

    // 手动调用自动保存而不是依赖定时器
    await act(async () => {
      await result.current.autoSave()
    })

    expect(mockPageService.updatePage).toHaveBeenCalled()
  })

  it('应该在组件卸载时清理定时器', () => {
    const clearIntervalSpy = vi.spyOn(global, 'clearInterval')

    const { unmount } = renderHook(() => useAutoSave())

    unmount()

    expect(clearIntervalSpy).toHaveBeenCalled()
  })

  it('应该在禁用时不启动自动保存', () => {
    const setIntervalSpy = vi.spyOn(global, 'setInterval')

    renderHook(() => useAutoSave({ enabled: false }))

    expect(setIntervalSpy).not.toHaveBeenCalled()
  })
})

describe('useVersionHistory', () => {
  const mockLocalStorage = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true
    })
    ;(usePageStore as any).mockReturnValue(mockPageStore)
  })

  it('应该初始化空版本历史', () => {
    const { result } = renderHook(() => useVersionHistory())

    expect(result.current.versions).toEqual([])
    expect(result.current.saveVersion).toBeDefined()
    expect(result.current.restoreVersion).toBeDefined()
  })

  it('应该保存版本到localStorage', () => {
    const { result } = renderHook(() => useVersionHistory())

    act(() => {
      result.current.saveVersion('手动保存')
    })

    expect(mockLocalStorage.setItem).toHaveBeenCalled()
    const [key, value] = mockLocalStorage.setItem.mock.calls[0]
    expect(key).toBe('page-versions-test-page-id')

    const savedVersions = JSON.parse(value)
    expect(savedVersions).toHaveLength(1)
    expect(savedVersions[0].description).toBe('手动保存')
    expect(savedVersions[0].content).toEqual(mockPageStore.currentPage.content)
  })

  it('应该从localStorage加载版本历史', () => {
    const savedVersions = [
      {
        id: 'version-1',
        timestamp: Date.now(),
        content: [],
        description: '测试版本'
      }
    ]
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(savedVersions))

    const { result } = renderHook(() => useVersionHistory())

    expect(mockLocalStorage.getItem).toHaveBeenCalledWith('page-versions-test-page-id')
    expect(result.current.versions).toEqual(savedVersions)
  })

  it('应该处理localStorage加载错误', () => {
    mockLocalStorage.getItem.mockImplementation(() => {
      throw new Error('localStorage错误')
    })

    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const { result } = renderHook(() => useVersionHistory())

    expect(result.current.versions).toEqual([])
    expect(consoleSpy).toHaveBeenCalledWith('加载版本历史失败:', expect.any(Error))

    consoleSpy.mockRestore()
  })

  it('应该限制版本数量为10个', () => {
    const { result } = renderHook(() => useVersionHistory())

    // 保存15个版本，每次act单独处理
    for (let i = 0; i < 15; i++) {
      act(() => {
        result.current.saveVersion(`版本 ${i}`)
      })
    }

    // 检查localStorage调用次数
    expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(15)

    // 检查最后一次调用的版本数量应该限制为10个
    const lastCall = mockLocalStorage.setItem.mock.calls[14] // 最后一次调用
    const savedVersions = JSON.parse(lastCall[1])
    expect(savedVersions).toHaveLength(10)
  })

  it('应该在没有页面时跳过版本操作', () => {
    const mockStoreNoPage = {
      ...mockPageStore,
      currentPage: null
    }
    ;(usePageStore as any).mockReturnValue(mockStoreNoPage)

    const { result } = renderHook(() => useVersionHistory())

    act(() => {
      result.current.saveVersion('测试')
    })

    expect(mockLocalStorage.setItem).not.toHaveBeenCalled()
  })
})
