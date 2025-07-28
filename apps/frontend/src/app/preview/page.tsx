'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { IPhonePreview } from '@/components/preview/iphone-preview'

export default function PreviewPage() {
  const searchParams = useSearchParams()
  const [htmlContent, setHtmlContent] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // 检查是否有预览ID（来自HTML导出）
    const previewId = searchParams.get('id')
    
    if (previewId) {
      try {
        // 从sessionStorage获取预览数据
        const previewDataString = sessionStorage.getItem(previewId)
        if (previewDataString) {
          const previewData = JSON.parse(previewDataString)
          setHtmlContent(previewData.content)
          // 清理sessionStorage中的数据
          sessionStorage.removeItem(previewId)
        } else {
          setHtmlContent('<div style="padding: 20px; text-align: center;">预览数据已过期</div>')
        }
      } catch (error) {
        console.error('解析预览数据失败:', error)
        setHtmlContent('<div style="padding: 20px; text-align: center;">预览数据解析失败</div>')
      }
    } else {
      // 从URL参数获取预览内容（兼容旧方式）
      const content = searchParams.get('content')
      
      if (content) {
        try {
          // 解码HTML内容
          const decodedContent = decodeURIComponent(content)
          setHtmlContent(decodedContent)
        } catch (error) {
          console.error('解析预览内容失败:', error)
          setHtmlContent('<div style="padding: 20px; text-align: center;">预览内容加载失败</div>')
        }
      } else {
        setHtmlContent('<div style="padding: 20px; text-align: center;">暂无预览内容</div>')
      }
    }
    
    setIsLoading(false)
  }, [searchParams])

  if (isLoading) {
    return (
      <div className="h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-gray-100 flex items-center justify-center overflow-hidden">
      <IPhonePreview deviceColor="black" showReflection={false}>
        <div 
          className="h-full w-full overflow-auto scrollbar-hide"
          style={{ 
            paddingTop: '54px', // 避开Dynamic Island和状态栏区域
            paddingLeft: '12px', // 左边距
            paddingRight: '12px', // 右边距
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      </IPhonePreview>
    </div>
  )
} 