import { useEffect, useRef, useState, useCallback } from 'react'
import { usePageStore } from '@/stores/usePageStore'
import { useEditorStore } from '@/stores/useEditorStore'
import { pageService } from '@/services/pageService'
import { toastManager } from '@/components/ui/toast'
import { useTranslation } from '@/contexts/I18nContext'

interface AutoSaveOptions {
  interval?: number // 自动保存间隔（毫秒）
  enabled?: boolean // 是否启用自动保存
  onSave?: () => void // 保存成功回调
  onError?: (error: Error) => void // 保存失败回调
}

export function useAutoSave(options: AutoSaveOptions = {}) {
  const {
    interval = 30000, // 默认30秒
    enabled = true,
    onSave,
    onError
  } = options

  const { tEditor } = useTranslation()
  const { currentPage, hasUnsavedChanges, markSaved, setPage } = usePageStore()

  const { setSaving, setError } = useEditorStore()

  const lastSaveTime = useRef<number>(0)
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null)

  // 自动保存函数
  const autoSave = useCallback(async () => {
    if (!currentPage || !hasUnsavedChanges) {
      return
    }

    setSaving(true)

    try {
      const updatedPage = await pageService.savePage({
        id: currentPage.id,
        name: currentPage.name,
        content: currentPage.content,
        target_area: currentPage.target_area
      })

      markSaved()
      // 更新页面信息，包括updated_at时间
      setPage(updatedPage)
      lastSaveTime.current = Date.now()

      console.log('自动保存成功')
      onSave?.()

      // 显示自动保存成功提示（蓝色info类型）
      toastManager.show({
        type: 'info',
        title: tEditor('自动保存'),
        description: tEditor('页面已自动保存'),
        duration: 2000
      })

      return updatedPage
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '自动保存失败'
      setError(errorMessage)
      onError?.(error instanceof Error ? error : new Error(errorMessage))
      console.error('自动保存失败:', error)
      throw error
    } finally {
      setSaving(false)
    }
  }, [currentPage, hasUnsavedChanges, setSaving, markSaved, setPage, setError, onSave, onError, tEditor])

  // 设置自动保存定时器
  useEffect(() => {
    if (!enabled || !currentPage) {
      return
    }

    const startAutoSave = () => {
      if (autoSaveTimer.current) {
        clearInterval(autoSaveTimer.current)
      }

      autoSaveTimer.current = setInterval(
        () => {
          const now = Date.now()
          const timeSinceLastSave = now - lastSaveTime.current

          // 如果有未保存的更改且距离上次保存超过间隔时间
          if (hasUnsavedChanges && timeSinceLastSave >= interval) {
            autoSave()
          }
        },
        Math.min(interval / 3, 10000)
      ) // 检查频率为间隔的1/3，最多10秒
    }

    startAutoSave()

    return () => {
      if (autoSaveTimer.current) {
        clearInterval(autoSaveTimer.current)
      }
    }
  }, [enabled, currentPage, hasUnsavedChanges, interval, autoSave])

  // 页面卸载前保存
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = '您有未保存的更改，确定要离开吗？'
        return '您有未保存的更改，确定要离开吗？'
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && hasUnsavedChanges) {
        // 页面即将隐藏时尝试保存
        autoSave()
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [hasUnsavedChanges, autoSave, currentPage])

  return {
    autoSave,
    lastSaveTime: lastSaveTime.current,
    isAutoSaving: false // 可以从useRequest中获取loading状态
  }
}

// 版本管理hooks
export function useVersionHistory() {
  const { currentPage } = usePageStore()
  const [versions, setVersions] = useState<
    Array<{
      id: string
      timestamp: number
      content: any
      description: string
    }>
  >([])

  // 保存版本到localStorage
  const saveVersion = useCallback(
    (description: string = '自动保存') => {
      if (!currentPage) return

      const version = {
        id: `version-${Date.now()}`,
        timestamp: Date.now(),
        content: JSON.parse(JSON.stringify(currentPage.content)),
        description
      }

      const newVersions = [version, ...versions].slice(0, 10) // 最多保存10个版本
      setVersions(newVersions)

      // 保存到localStorage
      try {
        localStorage.setItem(`page-versions-${currentPage.id}`, JSON.stringify(newVersions))
      } catch (error) {
        console.warn('保存版本历史失败:', error)
      }
    },
    [currentPage, versions]
  )

  // 从localStorage加载版本历史
  useEffect(() => {
    if (!currentPage) return

    try {
      const savedVersions = localStorage.getItem(`page-versions-${currentPage.id}`)
      if (savedVersions) {
        setVersions(JSON.parse(savedVersions))
      }
    } catch (error) {
      console.warn('加载版本历史失败:', error)
      setVersions([]) // 确保在错误时设置为空数组
    }
  }, [currentPage])

  // 恢复到指定版本
  const restoreVersion = useCallback(
    (versionId: string) => {
      const version = versions.find(v => v.id === versionId)
      if (!version || !currentPage) return

      // 这里需要调用updatePage来恢复内容
      // updatePage({ content: version.content });
    },
    [versions, currentPage]
  )

  return {
    versions,
    saveVersion,
    restoreVersion
  }
}
