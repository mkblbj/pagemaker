'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { IPhonePreview } from '@/components/preview/iphone-preview'
import { pageService } from '@/services/pageService'
import { generateHTML } from '@/services/htmlExportService'
import type { PageTemplate } from '@pagemaker/shared-types'

export default function PreviewPageById() {
  const params = useParams()
  const [htmlContent, setHtmlContent] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const pageId = params.pageId as string

  useEffect(() => {
    const loadPageData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // 获取页面数据
        const page = await pageService.getPage(pageId)

        // 生成HTML内容
        if (page.content && Array.isArray(page.content)) {
          const exportOptions = {
            includeStyles: false,
            minify: true,
            title: page.name || '页面预览',
            description: `使用 Pagemaker CMS 创建的页面：${page.name}`,
            language: 'ja-JP',
            fullDocument: true,
            mobileMode: true
          }

          const html = generateHTML(page.content, exportOptions)
          setHtmlContent(html)
        } else {
          setHtmlContent('<div style="padding: 20px; text-align: center;">页面内容为空</div>')
        }
      } catch (error) {
        console.error('加载页面数据失败:', error)
        setError('页面加载失败')
        setHtmlContent('<div style="padding: 20px; text-align: center;">页面加载失败</div>')
      } finally {
        setIsLoading(false)
      }
    }

    if (pageId) {
      loadPageData()
    }
  }, [pageId])

  if (isLoading) {
    return (
      <div className="h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-800 text-center">加载失败</div>
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
