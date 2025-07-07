import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

interface EditorState {
  // 加载状态
  isLoading: boolean

  // 保存状态
  isSaving: boolean
  hasUnsavedChanges: boolean

  // 错误状态
  error: string | null

  // UI状态
  leftPanelWidth: number
  rightPanelWidth: number
  isLeftPanelCollapsed: boolean
  isRightPanelCollapsed: boolean

  // 拖拽状态
  isDragging: boolean
  draggedModuleType: string | null

  // Actions
  setLoading: (loading: boolean) => void
  setSaving: (saving: boolean) => void
  setError: (error: string | null) => void
  markUnsaved: () => void
  markSaved: () => void

  // UI Actions
  setLeftPanelWidth: (width: number) => void
  setRightPanelWidth: (width: number) => void
  toggleLeftPanel: () => void
  toggleRightPanel: () => void

  // 拖拽 Actions
  setDragging: (isDragging: boolean, moduleType?: string) => void

  // 重置状态
  reset: () => void
}

export const useEditorStore = create<EditorState>()(
  devtools(
    set => ({
      // Initial state
      isLoading: false,
      isSaving: false,
      hasUnsavedChanges: false,
      error: null,
      leftPanelWidth: 280,
      rightPanelWidth: 320,
      isLeftPanelCollapsed: false,
      isRightPanelCollapsed: false,
      isDragging: false,
      draggedModuleType: null,

      // Actions
      setLoading: loading => set({ isLoading: loading }, false, 'setLoading'),

      setSaving: saving => set({ isSaving: saving }, false, 'setSaving'),

      setError: error => set({ error }, false, 'setError'),

      markUnsaved: () => set({ hasUnsavedChanges: true }, false, 'markUnsaved'),

      markSaved: () => set({ hasUnsavedChanges: false }, false, 'markSaved'),

      // UI Actions
      setLeftPanelWidth: width =>
        set({ leftPanelWidth: Math.max(200, Math.min(400, width)) }, false, 'setLeftPanelWidth'),

      setRightPanelWidth: width =>
        set({ rightPanelWidth: Math.max(250, Math.min(500, width)) }, false, 'setRightPanelWidth'),

      toggleLeftPanel: () =>
        set(state => ({ isLeftPanelCollapsed: !state.isLeftPanelCollapsed }), false, 'toggleLeftPanel'),

      toggleRightPanel: () =>
        set(state => ({ isRightPanelCollapsed: !state.isRightPanelCollapsed }), false, 'toggleRightPanel'),

      // 拖拽 Actions
      setDragging: (isDragging, moduleType) =>
        set(
          {
            isDragging,
            draggedModuleType: isDragging ? moduleType || null : null
          },
          false,
          'setDragging'
        ),

      // 重置状态
      reset: () =>
        set(
          {
            isLoading: false,
            isSaving: false,
            hasUnsavedChanges: false,
            error: null,
            isDragging: false,
            draggedModuleType: null
          },
          false,
          'reset'
        )
    }),
    { name: 'editor-store' }
  )
)
