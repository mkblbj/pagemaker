'use client'

import { useEffect } from 'react'
import { usePageStore } from '@/stores/usePageStore'
import { useEditorStore } from '@/stores/useEditorStore'

interface KeyboardShortcutsProps {
  onShowHelp?: () => void
}

export function KeyboardShortcuts({ onShowHelp }: KeyboardShortcutsProps) {
  const { currentPage, selectedModuleId, setSelectedModule, deleteModule, reorderModules } = usePageStore()
  const { markUnsaved } = useEditorStore()

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // 忽略在输入框中的按键
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement ||
        (event.target as HTMLElement)?.contentEditable === 'true'
      ) {
        return
      }

      // 帮助快捷键
      if (event.key === 'F1' || event.key === '?') {
        event.preventDefault()
        onShowHelp?.()
        return
      }

      const modules = currentPage?.content || []
      const selectedIndex = selectedModuleId ? modules.findIndex(m => m.id === selectedModuleId) : -1

      switch (event.key) {
        case 'ArrowUp':
          event.preventDefault()
          if (event.shiftKey && selectedModuleId && selectedIndex !== -1) {
            // Shift+ArrowUp: 向上移动模块
            if (selectedIndex > 0) {
              reorderModules(selectedIndex, selectedIndex - 1)
              markUnsaved()
            }
          } else {
            // 普通 ArrowUp: 向上选择模块
            if (selectedIndex > 0) {
              setSelectedModule(modules[selectedIndex - 1].id)
            } else if (modules.length > 0 && selectedIndex === -1) {
              setSelectedModule(modules[modules.length - 1].id)
            }
          }
          break

        case 'ArrowDown':
          event.preventDefault()
          if (event.shiftKey && selectedModuleId && selectedIndex !== -1) {
            // Shift+ArrowDown: 向下移动模块
            if (selectedIndex < modules.length - 1) {
              reorderModules(selectedIndex, selectedIndex + 1)
              markUnsaved()
            }
          } else {
            // 普通 ArrowDown: 向下选择模块
            if (selectedIndex < modules.length - 1 && selectedIndex !== -1) {
              setSelectedModule(modules[selectedIndex + 1].id)
            } else if (modules.length > 0 && selectedIndex === -1) {
              setSelectedModule(modules[0].id)
            }
          }
          break

        case 'Delete':
        case 'Backspace':
          event.preventDefault()
          if (selectedModuleId && confirm('确定要删除选中的模块吗？')) {
            deleteModule(selectedModuleId)
            markUnsaved()
          }
          break

        case 'Escape':
          event.preventDefault()
          setSelectedModule(null)
          break

        case 'Enter':
        case ' ':
          event.preventDefault()
          // 可以在这里添加编辑模块的逻辑
          break

        default:
          // Ctrl/Cmd + 组合键
          if (event.ctrlKey || event.metaKey) {
            switch (event.key) {
              case 'a':
                event.preventDefault()
                // 全选逻辑（可选）
                break

              case 'c':
                event.preventDefault()
                // 复制模块逻辑（可选）
                break

              case 'v':
                event.preventDefault()
                // 粘贴模块逻辑（可选）
                break

              case 'z':
                event.preventDefault()
                // 撤销逻辑（可选）
                break

              case 'y':
                event.preventDefault()
                // 重做逻辑（可选）
                break
            }
          }
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [currentPage?.content, selectedModuleId, setSelectedModule, deleteModule, reorderModules, markUnsaved, onShowHelp])

  return null // 这是一个无UI的功能组件
}
