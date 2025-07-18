import { renderHook, act } from '@testing-library/react'
import { useEditorStore } from './useEditorStore'

describe('useEditorStore', () => {
  beforeEach(() => {
    // 重置 store 状态
    useEditorStore.getState().reset()
  })

  it('应该初始化默认状态', () => {
    const { result } = renderHook(() => useEditorStore())

    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
    expect(result.current.isSaving).toBe(false)
    expect(result.current.leftPanelWidth).toBe(280)
    expect(result.current.rightPanelWidth).toBe(320)
    expect(result.current.isLeftPanelCollapsed).toBe(false)
    expect(result.current.isRightPanelCollapsed).toBe(false)
    expect(result.current.isDragging).toBe(false)
    expect(result.current.draggedModuleType).toBeNull()
  })

  it('应该正确设置加载状态', () => {
    const { result } = renderHook(() => useEditorStore())

    act(() => {
      result.current.setLoading(true)
    })

    expect(result.current.isLoading).toBe(true)

    act(() => {
      result.current.setLoading(false)
    })

    expect(result.current.isLoading).toBe(false)
  })

  it('应该正确设置保存状态', () => {
    const { result } = renderHook(() => useEditorStore())

    act(() => {
      result.current.setSaving(true)
    })

    expect(result.current.isSaving).toBe(true)

    act(() => {
      result.current.setSaving(false)
    })

    expect(result.current.isSaving).toBe(false)
  })

  it('应该正确设置错误状态', () => {
    const { result } = renderHook(() => useEditorStore())
    const errorMessage = 'Test error message'

    act(() => {
      result.current.setError(errorMessage)
    })

    expect(result.current.error).toBe(errorMessage)

    act(() => {
      result.current.setError(null)
    })

    expect(result.current.error).toBeNull()
  })

  it('应该正确设置左侧面板宽度', () => {
    const { result } = renderHook(() => useEditorStore())

    act(() => {
      result.current.setLeftPanelWidth(350)
    })

    expect(result.current.leftPanelWidth).toBe(350)

    // 测试边界值
    act(() => {
      result.current.setLeftPanelWidth(100) // 小于最小值
    })

    expect(result.current.leftPanelWidth).toBe(200) // 应该被限制为最小值

    act(() => {
      result.current.setLeftPanelWidth(600) // 大于最大值
    })

    expect(result.current.leftPanelWidth).toBe(500) // 应该被限制为最大值
  })

  it('应该正确设置右侧面板宽度', () => {
    const { result } = renderHook(() => useEditorStore())

    act(() => {
      result.current.setRightPanelWidth(400)
    })

    expect(result.current.rightPanelWidth).toBe(400)

    // 测试边界值
    act(() => {
      result.current.setRightPanelWidth(100) // 小于最小值
    })

    expect(result.current.rightPanelWidth).toBe(250) // 应该被限制为最小值

    act(() => {
      result.current.setRightPanelWidth(700) // 大于最大值
    })

    expect(result.current.rightPanelWidth).toBe(600) // 应该被限制为最大值
  })

  it('应该正确切换面板折叠状态', () => {
    const { result } = renderHook(() => useEditorStore())

    // 切换左侧面板
    act(() => {
      result.current.toggleLeftPanel()
    })

    expect(result.current.isLeftPanelCollapsed).toBe(true)

    act(() => {
      result.current.toggleLeftPanel()
    })

    expect(result.current.isLeftPanelCollapsed).toBe(false)

    // 切换右侧面板
    act(() => {
      result.current.toggleRightPanel()
    })

    expect(result.current.isRightPanelCollapsed).toBe(true)

    act(() => {
      result.current.toggleRightPanel()
    })

    expect(result.current.isRightPanelCollapsed).toBe(false)
  })

  it('应该正确管理拖拽状态', () => {
    const { result } = renderHook(() => useEditorStore())

    act(() => {
      result.current.setDragging(true, 'text')
    })

    expect(result.current.isDragging).toBe(true)
    expect(result.current.draggedModuleType).toBe('text')

    act(() => {
      result.current.setDragging(false)
    })

    expect(result.current.isDragging).toBe(false)
    expect(result.current.draggedModuleType).toBeNull()
  })

  it('应该正确重置编辑器状态', () => {
    const { result } = renderHook(() => useEditorStore())

    // 设置一些状态
    act(() => {
      result.current.setLoading(true)
      result.current.setError('Some error')
      result.current.setSaving(true)
      result.current.setDragging(true, 'image')
    })

    // 重置状态
    act(() => {
      result.current.reset()
    })

    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
    expect(result.current.isSaving).toBe(false)
    expect(result.current.isDragging).toBe(false)
    expect(result.current.draggedModuleType).toBeNull()
  })
})
