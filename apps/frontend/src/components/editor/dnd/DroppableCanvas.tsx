'use client'

import React, { ReactNode, useEffect, useRef } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { useEditorStore } from '@/stores/useEditorStore'
import { useTranslation } from '@/contexts/I18nContext'

interface DroppableCanvasProps {
  children: ReactNode
  className?: string
}

export function DroppableCanvas({ children, className = '' }: DroppableCanvasProps) {
  const { isDragging } = useEditorStore()
  const containerRef = useRef<HTMLDivElement>(null)
  const { tEditor } = useTranslation()
  const { isOver, setNodeRef } = useDroppable({
    id: 'canvas',
    data: {
      type: 'CANVAS'
    }
  })

  // 自动滚动功能
  useEffect(() => {
    if (!isDragging || !containerRef.current) return

    let animationFrame: number
    let isScrolling = false

    const handleAutoScroll = (event: MouseEvent) => {
      if (!containerRef.current || isScrolling) return

      const container = containerRef.current
      const rect = container.getBoundingClientRect()
      const scrollThreshold = 50 // 距离边缘多少像素开始滚动
      const scrollSpeed = 5 // 滚动速度

      const mouseY = event.clientY
      const containerTop = rect.top
      const containerBottom = rect.bottom

      let shouldScroll = false
      let scrollDirection = 0

      // 检查是否需要向上滚动
      if (mouseY - containerTop < scrollThreshold && container.scrollTop > 0) {
        shouldScroll = true
        scrollDirection = -scrollSpeed
      }
      // 检查是否需要向下滚动
      else if (
        containerBottom - mouseY < scrollThreshold &&
        container.scrollTop < container.scrollHeight - container.clientHeight
      ) {
        shouldScroll = true
        scrollDirection = scrollSpeed
      }

      if (shouldScroll) {
        isScrolling = true
        animationFrame = requestAnimationFrame(() => {
          container.scrollTop += scrollDirection
          isScrolling = false
        })
      }
    }

    document.addEventListener('mousemove', handleAutoScroll)

    return () => {
      document.removeEventListener('mousemove', handleAutoScroll)
      if (animationFrame) {
        cancelAnimationFrame(animationFrame)
      }
    }
  }, [isDragging])

  return (
    <div
      ref={node => {
        setNodeRef(node)
        containerRef.current = node
      }}
      data-testid="canvas"
      className={`
        ${className}
        ${isDragging ? 'bg-blue-50/30 border-2 border-dashed border-blue-300/50' : ''}
        ${isOver ? 'bg-blue-100/50 border-blue-400/70' : ''}
        transition-colors duration-200
      `}
    >
      {children}

      {/* 拖拽提示 */}
      {isDragging && isOver && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-lg border border-blue-200">
            <div className="text-blue-600 font-medium text-center">{tEditor('拖拽模块到此处添加')}</div>
          </div>
        </div>
      )}
    </div>
  )
}
