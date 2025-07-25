import { useCallback } from 'react'
import { usePageStore } from '@/stores/usePageStore'
import { useEditorStore } from '@/stores/useEditorStore'
import { pageService } from '@/services/pageService'
import { useRequest } from 'ahooks'
import { toastManager } from '@/components/ui/toast'
import { useTranslation } from '@/contexts/I18nContext'

export function usePageEditor() {
  const { tEditor } = useTranslation()
  const { currentPage, hasUnsavedChanges, markSaved, markUnsaved, setPage } = usePageStore()

  const { setSaving, setError } = useEditorStore()

  // 保存页面
  const { run: savePage, loading: isSaving } = useRequest(
    async () => {
      if (!currentPage) {
        throw new Error('没有可保存的页面')
      }

      setSaving(true)

      try {
        const updatedPage = await pageService.updatePage(currentPage.id, {
          name: currentPage.name,
          content: currentPage.content,
          target_area: currentPage.target_area
        })

        // 确保状态同步更新
        markSaved()
        // 更新页面信息，包括updated_at时间
        setPage(updatedPage)
        return updatedPage
      } catch (error) {
        setError(error instanceof Error ? error.message : '保存失败')
        throw error
      } finally {
        setSaving(false)
      }
    },
    {
      manual: true,
      onSuccess: updatedPage => {
        console.log('页面保存成功')
        // 显示保存成功提示
        toastManager.show({
          type: 'success',
          title: tEditor('保存成功'),
          description: tEditor('页面保存成功', { name: updatedPage.name }),
          duration: 3000
        })
      },
      onError: error => {
        console.error('页面保存失败:', error)
        // 显示保存失败提示
        toastManager.show({
          type: 'error',
          title: tEditor('保存失败'),
          description: tEditor('页面保存失败', {
            error: error instanceof Error ? error.message : tEditor('未知错误')
          }),
          duration: 5000
        })
      }
    }
  )

  // 预览页面
  const previewPage = useCallback(async () => {
    if (!currentPage) return

    try {
      // 如果有未保存的更改，先保存
      if (hasUnsavedChanges) {
        await savePage()
      }

      // 打开预览窗口
      const previewUrl = `/preview/${currentPage.id}`
      window.open(previewUrl, '_blank', 'width=1200,height=800')
    } catch (error) {
      console.error('预览失败:', error)
      setError('预览失败，请先保存页面')
    }
  }, [currentPage, hasUnsavedChanges, savePage, setError])

  // 自动保存
  const { run: autoSave } = useRequest(
    async () => {
      if (!currentPage || !hasUnsavedChanges) return

      console.log('自动保存中...')
      await savePage()
    },
    {
      manual: true,
      debounceWait: 2000, // 2秒防抖
      onSuccess: () => {
        console.log('自动保存完成')
        // 显示自动保存成功提示（较短时间）
        toastManager.show({
          type: 'info',
          title: tEditor('自动保存'),
          description: tEditor('页面已自动保存'),
          duration: 2000
        })
      }
    }
  )

  // 发布页面
  const { run: publishPage, loading: isPublishing } = useRequest(
    async () => {
      if (!currentPage) {
        throw new Error('没有可发布的页面')
      }

      try {
        const result = await pageService.publishPage(currentPage.id)
        return result
      } catch (error) {
        setError(error instanceof Error ? error.message : '发布失败')
        throw error
      }
    },
    {
      manual: true,
      onSuccess: () => {
        console.log('页面发布成功')
      }
    }
  )

  return {
    // 状态
    currentPage,
    hasUnsavedChanges,
    isSaving,
    isPublishing,

    // 操作
    savePage,
    previewPage,
    publishPage,
    autoSave
  }
}
