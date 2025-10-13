'use client'

import { useEffect, useRef, useState } from 'react'
import { HtmlModule, ModuleState } from '@/lib/htmlSplitter'
import { mountEditor } from '@/lib/moduleRenderer'
import { exportModulesHtml } from '@/lib/htmlSplitter'
import '@/lib/moduleRenderer.css'
import '@/lib/textEditor.css'

export interface HtmlSplitEditorProps {
  module: HtmlModule
  onUpdate?: (html: string) => void
  className?: string
}

/**
 * HTML 拆分编辑器组件
 * 
 * 集成 P0-P3 核心功能：
 * - P0: HTML 净化（Rakuten 合规）
 * - P1: HTML 拆分引擎
 * - P2: 就地渲染与 Overlay
 * - P3: 文本编辑（单击激活、失焦保存）
 */
export function HtmlSplitEditor({ module, onUpdate, className }: HtmlSplitEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const stateRef = useRef<ModuleState | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (!editorRef.current) return

    try {
      // 挂载编辑器
      const state = mountEditor(editorRef.current, [module], {
        onModuleUpdate: (updatedModule: HtmlModule) => {
          // 模块更新时通知父组件
          if (onUpdate) {
            onUpdate(updatedModule.html)
          }
        }
      })
      
      stateRef.current = state
      setIsReady(true)

      // 清理函数
      return () => {
        if (stateRef.current) {
          // 清理所有编辑器监听器
          stateRef.current.editCleanups.forEach(cleanup => cleanup())
          stateRef.current.editCleanups.clear()
        }
        setIsReady(false)
      }
    } catch (error) {
      console.error('HtmlSplitEditor: 挂载编辑器失败', error)
      setIsReady(false)
    }
  }, [module.id]) // 仅在模块 ID 变化时重新挂载

  // 当模块内容更新时，更新状态
  useEffect(() => {
    if (!stateRef.current || !isReady) return

    // 更新模块列表中的内容
    const currentModule = stateRef.current.list[0]
    if (currentModule && currentModule.id === module.id && currentModule.html !== module.html) {
      stateRef.current.list[0] = { ...module }
    }
  }, [module.html, isReady])

  return (
    <div className={`html-split-editor ${className || ''}`}>
      <div 
        ref={editorRef} 
        className="pm-editor-root"
        data-module-kind={module.kind}
        data-module-id={module.id}
      />
    </div>
  )
}

/**
 * 导出模块的 HTML
 * 
 * 用于从外部获取编辑后的 HTML 内容
 */
export function exportModuleHtml(module: HtmlModule): string {
  return exportModulesHtml([module])
}

