'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { IPhonePreview } from '@/components/preview/iphone-preview'
import { Button } from '@/components/ui/button'
import { ArrowLeft, RotateCcw, Share2, Download, Smartphone, Monitor } from 'lucide-react'
import { useTranslation } from '@/contexts/I18nContext'

export default function PreviewPage() {
  const { tEditor } = useTranslation()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [htmlContent, setHtmlContent] = useState('')
  const [pageTitle, setPageTitle] = useState('页面预览')
  const [previewMode, setPreviewMode] = useState<'mobile' | 'desktop'>('mobile')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // 从URL参数获取预览内容
    const content = searchParams.get('content')
    const title = searchParams.get('title')
    const mode = searchParams.get('mode') as 'mobile' | 'desktop'
    
    if (content) {
      try {
        // 解码HTML内容
        const decodedContent = decodeURIComponent(content)
        setHtmlContent(decodedContent)
        setPageTitle(title || '页面预览')
        setPreviewMode(mode || 'mobile')
      } catch (error) {
        console.error('解析预览内容失败:', error)
        setHtmlContent('<div style="padding: 20px; text-align: center;">预览内容加载失败</div>')
      }
    } else {
      setHtmlContent('<div style="padding: 20px; text-align: center;">暂无预览内容</div>')
    }
    
    setIsLoading(false)
  }, [searchParams])

  const handleBack = () => {
    router.back()
  }

  const handleRefresh = () => {
    window.location.reload()
  }

  const handleShare = async () => {
    try {
      await navigator.share({
        title: pageTitle,
        url: window.location.href
      })
    } catch (error) {
      // 如果不支持Web Share API，复制链接到剪贴板
      await navigator.clipboard.writeText(window.location.href)
      // 这里可以添加提示
    }
  }

  const togglePreviewMode = () => {
    const newMode = previewMode === 'mobile' ? 'desktop' : 'mobile'
    setPreviewMode(newMode)
    
    // 更新URL参数
    const currentUrl = new URL(window.location.href)
    currentUrl.searchParams.set('mode', newMode)
    window.history.replaceState({}, '', currentUrl.toString())
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载预览中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* 顶部工具栏 */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                {tEditor('返回编辑')}
              </Button>
              <div className="text-lg font-semibold text-gray-900">
                {pageTitle}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={togglePreviewMode}
                className="flex items-center gap-2"
              >
                {previewMode === 'mobile' ? (
                  <>
                    <Monitor className="h-4 w-4" />
                    {tEditor('桌面模式')}
                  </>
                ) : (
                  <>
                    <Smartphone className="h-4 w-4" />
                    {tEditor('移动模式')}
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                className="flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                {tEditor('刷新')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="flex items-center gap-2"
              >
                <Share2 className="h-4 w-4" />
                {tEditor('分享')}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 预览区域 */}
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-8">
        {previewMode === 'mobile' ? (
          <div className="relative">
            {/* iPhone 预览组件 */}
            <IPhonePreview deviceColor="black" showReflection={true}>
              <div 
                className="h-full w-full overflow-auto"
                dangerouslySetInnerHTML={{ __html: htmlContent }}
              />
            </IPhonePreview>
            
            {/* 设备标签 */}
            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
              <div className="bg-black/80 text-white px-3 py-1 rounded-full text-sm font-medium">
                iPhone 16 Pro Max
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-6xl mx-auto">
            {/* 桌面预览 */}
            <div className="bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden">
              <div 
                className="w-full min-h-[600px] overflow-auto"
                dangerouslySetInnerHTML={{ __html: htmlContent }}
              />
            </div>
            
            {/* 桌面标签 */}
            <div className="text-center mt-4">
              <div className="bg-gray-800 text-white px-4 py-2 rounded-full text-sm font-medium inline-block">
                桌面预览
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 底部信息 */}
      <div className="text-center pb-8 text-gray-500 text-sm">
        <p>使用 Pagemaker CMS 创建 • {previewMode === 'mobile' ? '移动端预览' : '桌面端预览'}</p>
      </div>
    </div>
  )
} 