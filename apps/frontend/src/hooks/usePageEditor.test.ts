import { renderHook, act, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { usePageEditor } from './usePageEditor'
import { usePageStore } from '@/stores/usePageStore'
import { useEditorStore } from '@/stores/useEditorStore'
import { pageService } from '@/services/pageService'
import { PageModuleType } from '@pagemaker/shared-types'

// Mock stores and services
vi.mock('@/stores/usePageStore')
vi.mock('@/stores/useEditorStore')
vi.mock('@/services/pageService')
vi.mock('ahooks', () => ({
  useRequest: vi.fn((fn, options) => {
    const mockRun = vi.fn(async (...args) => {
      try {
        const result = await fn(...args)
        options?.onSuccess?.(result)
        return result
      } catch (error) {
        options?.onError?.(error)
        throw error
      }
    })

    return {
      run: mockRun,
      loading: false,
      data: null,
      error: null
    }
  })
}))

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
  markUnsaved: vi.fn(),
  setPage: vi.fn()
}

const mockEditorStore = {
  setSaving: vi.fn(),
  setError: vi.fn()
}

const mockPageService = pageService as any

// Mock window.open
global.window.open = vi.fn()

describe('usePageEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(usePageStore as any).mockReturnValue(mockPageStore)
    ;(useEditorStore as any).mockReturnValue(mockEditorStore)
    mockPageService.updatePage.mockResolvedValue(mockPageStore.currentPage)
    mockPageService.publishPage.mockResolvedValue({ success: true })
  })

  it('应该初始化正确的状态和方法', () => {
    const { result } = renderHook(() => usePageEditor())

    expect(result.current.currentPage).toEqual(mockPageStore.currentPage)
    expect(result.current.hasUnsavedChanges).toBe(false)
    expect(result.current.isSaving).toBe(false)
    expect(result.current.isPublishing).toBe(false)
    expect(result.current.savePage).toBeDefined()
    expect(result.current.previewPage).toBeDefined()
    expect(result.current.publishPage).toBeDefined()
    expect(result.current.autoSave).toBeDefined()
  })

  it('应该成功保存页面', async () => {
    const { result } = renderHook(() => usePageEditor())

    await act(async () => {
      await result.current.savePage()
    })

    expect(mockEditorStore.setSaving).toHaveBeenCalledWith(true)
    expect(mockPageService.updatePage).toHaveBeenCalledWith('test-page-id', {
      name: 'Test Page',
      content: mockPageStore.currentPage.content,
      target_area: 'pc'
    })
    expect(mockPageStore.markSaved).toHaveBeenCalled()
    expect(mockPageStore.setPage).toHaveBeenCalledWith(mockPageStore.currentPage)
    expect(mockEditorStore.setSaving).toHaveBeenCalledWith(false)
  })

  it('应该处理保存页面时的错误', async () => {
    const error = new Error('保存失败')
    mockPageService.updatePage.mockRejectedValue(error)

    const { result } = renderHook(() => usePageEditor())

    await act(async () => {
      try {
        await result.current.savePage()
      } catch (e) {
        expect(e).toBe(error)
      }
    })

    expect(mockEditorStore.setError).toHaveBeenCalledWith('保存失败')
    expect(mockEditorStore.setSaving).toHaveBeenCalledWith(false)
  })

  it('应该在没有页面时抛出错误', async () => {
    const mockStoreNoPage = {
      ...mockPageStore,
      currentPage: null
    }
    ;(usePageStore as any).mockReturnValue(mockStoreNoPage)

    const { result } = renderHook(() => usePageEditor())

    await act(async () => {
      try {
        await result.current.savePage()
      } catch (error) {
        expect(error.message).toBe('没有可保存的页面')
      }
    })
  })

  it('应该成功预览页面', async () => {
    const { result } = renderHook(() => usePageEditor())

    await act(async () => {
      await result.current.previewPage()
    })

    expect(window.open).toHaveBeenCalledWith('/preview/test-page-id', '_blank', 'width=1200,height=800')
  })

  it('应该在预览前保存未保存的更改', async () => {
    const mockStoreWithChanges = {
      ...mockPageStore,
      hasUnsavedChanges: true
    }
    ;(usePageStore as any).mockReturnValue(mockStoreWithChanges)

    const { result } = renderHook(() => usePageEditor())

    await act(async () => {
      await result.current.previewPage()
    })

    expect(mockPageService.updatePage).toHaveBeenCalled()
    expect(window.open).toHaveBeenCalled()
  })

  it('应该处理预览时的错误', async () => {
    const mockStoreWithChanges = {
      ...mockPageStore,
      hasUnsavedChanges: true
    }
    ;(usePageStore as any).mockReturnValue(mockStoreWithChanges)

    const error = new Error('保存失败')
    mockPageService.updatePage.mockRejectedValue(error)

    const { result } = renderHook(() => usePageEditor())

    await act(async () => {
      await result.current.previewPage()
    })

    expect(mockEditorStore.setError).toHaveBeenCalledWith('预览失败，请先保存页面')
  })

  it('应该在没有页面时跳过预览', async () => {
    const mockStoreNoPage = {
      ...mockPageStore,
      currentPage: null
    }
    ;(usePageStore as any).mockReturnValue(mockStoreNoPage)

    const { result } = renderHook(() => usePageEditor())

    await act(async () => {
      await result.current.previewPage()
    })

    expect(window.open).not.toHaveBeenCalled()
  })

  it('应该成功发布页面', async () => {
    const { result } = renderHook(() => usePageEditor())

    await act(async () => {
      await result.current.publishPage()
    })

    expect(mockPageService.publishPage).toHaveBeenCalledWith('test-page-id')
  })

  it('应该处理发布页面时的错误', async () => {
    const error = new Error('发布失败')
    mockPageService.publishPage.mockRejectedValue(error)

    const { result } = renderHook(() => usePageEditor())

    await act(async () => {
      try {
        await result.current.publishPage()
      } catch (e) {
        expect(e).toBe(error)
      }
    })

    expect(mockEditorStore.setError).toHaveBeenCalledWith('发布失败')
  })

  it('应该在没有页面时抛出发布错误', async () => {
    const mockStoreNoPage = {
      ...mockPageStore,
      currentPage: null
    }
    ;(usePageStore as any).mockReturnValue(mockStoreNoPage)

    const { result } = renderHook(() => usePageEditor())

    await act(async () => {
      try {
        await result.current.publishPage()
      } catch (error) {
        expect(error.message).toBe('没有可发布的页面')
      }
    })
  })

  it('应该执行自动保存', async () => {
    const mockStoreWithChanges = {
      ...mockPageStore,
      hasUnsavedChanges: true
    }
    ;(usePageStore as any).mockReturnValue(mockStoreWithChanges)

    const { result } = renderHook(() => usePageEditor())

    await act(async () => {
      await result.current.autoSave()
    })

    expect(mockPageService.updatePage).toHaveBeenCalled()
  })

  it('应该在没有未保存更改时跳过自动保存', async () => {
    const { result } = renderHook(() => usePageEditor())

    await act(async () => {
      await result.current.autoSave()
    })

    expect(mockPageService.updatePage).not.toHaveBeenCalled()
  })
})
