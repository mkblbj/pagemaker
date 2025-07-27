'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { IPhonePreview } from '@/components/preview/iphone-preview'

function PreviewContent() {
  const searchParams = useSearchParams()
  const [htmlContent, setHtmlContent] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // 清理过期的预览数据（超过1小时的数据）
    const cleanupOldPreviews = () => {
      const now = Date.now()
      const oneHour = 60 * 60 * 1000
      
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('preview_')) {
          const timestamp = parseInt(key.split('_')[1])
          if (now - timestamp > oneHour) {
            localStorage.removeItem(key)
          }
        }
      })
    }
    
    cleanupOldPreviews()
    
    // 从URL参数获取预览ID，然后从localStorage读取内容
    const previewId = searchParams.get('id')
    
    if (previewId) {
      try {
        // 从localStorage获取HTML内容
        const content = localStorage.getItem(previewId)
        if (content) {
          setHtmlContent(content)
          // 使用后清除localStorage中的数据
          localStorage.removeItem(previewId)
        } else {
          setHtmlContent('<div style="padding: 20px; text-align: center; color: #666;">预览内容已过期或不存在</div>')
        }
      } catch (error) {
        console.error('读取预览内容失败:', error)
        setHtmlContent('<div style="padding: 20px; text-align: center; color: #666;">预览内容加载失败</div>')
      }
    } else {
      // 兼容旧的URL参数方式
      const content = searchParams.get('content')
      if (content) {
        try {
          const decodedContent = decodeURIComponent(content)
          setHtmlContent(decodedContent)
        } catch (error) {
          console.error('解析预览内容失败:', error)
          setHtmlContent('<div style="padding: 20px; text-align: center; color: #666;">预览内容加载失败</div>')
        }
      } else {
        setHtmlContent('<div style="padding: 20px; text-align: center; color: #666;">暂无预览内容</div>')
      }
    }
    
    setIsLoading(false)
  }, [searchParams])

  if (isLoading) {
    return (
      <div className="h-screen bg-gray-100 flex items-center justify-center overflow-hidden">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-gray-100 flex items-center justify-center p-4 overflow-hidden">
      <div className="scale-90 sm:scale-110 lg:scale-125 xl:scale-150">
        <IPhonePreview deviceColor="black" showReflection={true} className="iphone-preview-area">
          <div 
            className="h-full w-full preview-content"
            style={{
              paddingTop: '60px',
              paddingBottom: '20px', 
              paddingLeft: '10px',
              paddingRight: '10px',
              overflowY: 'auto',
              overflowX: 'hidden',
              boxSizing: 'border-box',
            }}
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        </IPhonePreview>
      </div>
    </div>
  )
}

export default function PreviewPage() {
  return (
    <>
      {/* 添加全局样式来隐藏滚动条 */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .preview-content {
            -webkit-overflow-scrolling: touch;
            scroll-behavior: smooth;
            scrollbar-width: none;
            -ms-overflow-style: none;
            cursor: grab;
          }
          
          .preview-content:active {
            cursor: grabbing;
          }
          
          .preview-content::-webkit-scrollbar {
            width: 0px;
            background: transparent;
          }
          
          body {
            overflow: hidden !important;
            cursor: default;
          }
          html {
            overflow: hidden !important;
          }
          
          /* iPhone区域也使用手型光标 */
          .iphone-preview-area {
            cursor: grab;
          }
          
          .iphone-preview-area:active {
            cursor: grabbing;
          }
        `
      }} />
      <Suspense fallback={
        <div className="h-screen bg-gray-100 flex items-center justify-center overflow-hidden">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-600 mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">加载中...</p>
          </div>
        </div>
      }>
        <PreviewContent />
      </Suspense>
    </>
  )
} 