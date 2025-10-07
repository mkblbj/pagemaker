'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import ImageSelectorDialog, { type ImageSelectorResult } from '@/components/feature/ImageSelectorDialog'
import { useTranslation } from '@/contexts/I18nContext'

interface EditableCustomHTMLRendererProps {
  html: string
  isEditing?: boolean
  onUpdate?: (html: string) => void
}

export function EditableCustomHTMLRenderer({ html, isEditing = false, onUpdate }: EditableCustomHTMLRendererProps) {
  const { tEditor } = useTranslation()
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [iframeHeight, setIframeHeight] = useState(200)
  const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(null)
  const [showImageSelector, setShowImageSelector] = useState(false)
  const editingElementRef = useRef<HTMLElement | null>(null)

  // 同步 HTML 修改回父组件
  const syncHTMLChanges = useCallback(() => {
    const iframe = iframeRef.current
    if (!iframe || !onUpdate) return

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
    if (!iframeDoc) return

    const updatedHTML = iframeDoc.body.innerHTML
    onUpdate(updatedHTML)
  }, [onUpdate])

  // 处理图片选择
  const handleImageSelect = useCallback(
    (result: ImageSelectorResult) => {
      if (!selectedImage) return

      // 更新图片 src 和 alt
      selectedImage.src = result.url
      selectedImage.alt = result.filename

      // 同步修改
      syncHTMLChanges()

      setShowImageSelector(false)
      setSelectedImage(null)
    },
    [selectedImage, syncHTMLChanges]
  )

  // 初始化 iframe 并注入编辑脚本
  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
    if (!iframeDoc) return

    // 写入HTML内容
    iframeDoc.open()
    iframeDoc.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { 
            margin: 0; 
            padding: 0; 
            font-family: inherit; 
          }
          
          /* 编辑模式样式 */
          ${isEditing ? `
          .editable-text:hover {
            outline: 1px dashed #3b82f6;
            outline-offset: 2px;
            cursor: text;
            position: relative;
          }
          
          .editable-text:hover::after {
            content: '双击编辑';
            position: absolute;
            top: -24px;
            left: 0;
            background: #3b82f6;
            color: white;
            padding: 2px 6px;
            font-size: 11px;
            border-radius: 3px;
            white-space: nowrap;
            z-index: 1000;
          }
          
          .editing-text {
            outline: 2px solid #3b82f6 !important;
            outline-offset: 2px;
            background: #eff6ff !important;
          }
          
          .editable-image {
            cursor: pointer !important;
            transition: opacity 0.2s, outline 0.2s;
          }
          
          .editable-image:hover {
            opacity: 0.85;
            outline: 2px solid #3b82f6;
            outline-offset: 2px;
          }
          ` : ''}
        </style>
      </head>
      <body>
        ${html}
      </body>
      </html>
    `)
    iframeDoc.close()

    // 自动调整iframe高度
    const resizeIframe = () => {
      const body = iframeDoc.body
      const html = iframeDoc.documentElement
      const height = Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight)
      setIframeHeight(height)
    }

    // 等待内容加载完成
    setTimeout(resizeIframe, 100)

    // 监听窗口大小变化
    const observer = new ResizeObserver(resizeIframe)
    observer.observe(iframeDoc.body)

    // 如果是编辑模式，注入编辑功能
    if (isEditing) {
      // 为所有文本节点的父元素添加可编辑类和事件
      const textElements = iframeDoc.querySelectorAll('td, p, div, span, font, b, strong, i, em, u, h1, h2, h3, h4, h5, h6')
      textElements.forEach(el => {
        const element = el as HTMLElement
        element.classList.add('editable-text')

        // 双击进入编辑模式
        element.addEventListener('dblclick', (e: Event) => {
          e.stopPropagation()
          const target = e.target as HTMLElement

          // 跳过图片
          if (target.tagName === 'IMG') return

          // 设置为可编辑
          target.contentEditable = 'true'
          target.focus()
          target.classList.add('editing-text')
          editingElementRef.current = target

          // 失焦保存
          const handleBlur = () => {
            target.contentEditable = 'false'
            target.classList.remove('editing-text')
            editingElementRef.current = null

            // 同步修改
            syncHTMLChanges()

            target.removeEventListener('blur', handleBlur)
          }

          target.addEventListener('blur', handleBlur)
        })
      })

      // 为所有图片添加点击事件
      const images = iframeDoc.querySelectorAll('img')
      images.forEach(img => {
        const image = img as HTMLImageElement
        image.classList.add('editable-image')

        image.addEventListener('click', (e: Event) => {
          e.preventDefault()
          e.stopPropagation()

          // 通过 window.parent 通知父窗口
          setSelectedImage(image)
          setShowImageSelector(true)
        })
      })
    }

    return () => {
      observer.disconnect()
    }
  }, [html, isEditing, syncHTMLChanges])

  return (
    <>
      <iframe
        ref={iframeRef}
        className="custom-html-iframe w-full border-0"
        style={{ height: `${iframeHeight}px` }}
        title="Custom HTML Content"
      />

      {/* 图片选择对话框 */}
      {isEditing && (
        <ImageSelectorDialog open={showImageSelector} onOpenChange={setShowImageSelector} onSelect={handleImageSelect} />
      )}
    </>
  )
}
