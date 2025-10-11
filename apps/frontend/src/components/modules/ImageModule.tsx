'use client'

import { useState } from 'react'
import { Image as ImageIcon, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { PageModule } from '@pagemaker/shared-types'
import { useTranslation } from '@/contexts/I18nContext'
import ImageSelectorDialog from '@/components/feature/ImageSelectorDialog'
import { usePageStore } from '@/stores/usePageStore'

// 图片模块配置接口
interface ImageModuleConfig {
  src: string // R-Cabinet图片URL
  alt: string // Alt文本
  alignment: 'left' | 'center' | 'right' // 对齐方式
  link?: {
    type: 'url' | 'email' | 'phone' | 'anchor'
    value: string
  } // 超链接配置
  size: {
    type: 'preset' | 'percentage'
    value: string // 预设名称或百分比值
  } // 尺寸配置
}

interface ImageModuleProps {
  module: PageModule & ImageModuleConfig
  isSelected?: boolean
  isEditing?: boolean
  onUpdate?: (updates: Partial<PageModule>) => void
  onStartEdit?: () => void
  onEndEdit?: () => void
}

// 预设尺寸选项
const PRESET_SIZES = [
  { value: 'small', label: '小图 (200px)', width: '200px' },
  { value: 'medium', label: '中图 (400px)', width: '400px' },
  { value: 'large', label: '大图 (600px)', width: '600px' },
  { value: 'full', label: '全宽', width: '100%' }
]

export function ImageModule({
  module,
  isSelected = false,
  isEditing = false,
  onUpdate,
  onStartEdit,
  onEndEdit: _onEndEdit
}: ImageModuleProps) {
  const { tEditor } = useTranslation()
  const [showImageSelector, setShowImageSelector] = useState(false)

  // 统一图片选择回调（来自共享对话框）
  const handleSelect = (result: { url: string; filename: string }) => {
    onUpdate?.({
      src: result.url,
      alt: module.alt || result.filename.replace(/\.[^/.]+$/, '')
    })
  }

  // 获取图片样式
  const getImageStyles = () => {
    const styles: React.CSSProperties = {}

    // 对齐方式
    const alignment = module.alignment || 'center'

    // 尺寸设置
    const size = module.size || { type: 'preset', value: 'full' }
    if (size.type === 'preset') {
      const preset = PRESET_SIZES.find(p => p.value === size.value)
      if (preset) {
        styles.width = preset.width
      }
    } else if (size.type === 'percentage') {
      styles.width = `${size.value}%`
    }

    styles.maxWidth = '100%'
    styles.height = 'auto'

    return { styles, alignment }
  }

  // 获取链接配置
  const getLinkHref = () => {
    if (!module.link) return undefined

    switch (module.link.type) {
      case 'email':
        return `mailto:${module.link.value}`
      case 'phone':
        return `tel:${module.link.value}`
      case 'anchor':
        return `#${module.link.value}`
      default:
        return module.link.value
    }
  }

  const { styles: imageStyles, alignment } = getImageStyles()
  const linkHref = getLinkHref()

  // 渲染图片内容
  const renderImageContent = () => {
    if (!module.src) {
      return (
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors"
          onClick={() => setShowImageSelector(true)}
        >
          <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">{tEditor('点击选择图片')}</p>
          <p className="text-sm text-gray-400">{tEditor('支持 JPG、PNG、GIF、WebP 格式')}</p>
        </div>
      )
    }

    const imageElement = (
      <img src={module.src} alt={module.alt || ''} style={imageStyles} className="transition-all duration-200" />
    )

    return linkHref ? (
      <a href={linkHref} target="_blank" rel="noopener noreferrer">
        {imageElement}
      </a>
    ) : (
      imageElement
    )
  }

  return (
    <div
      className={cn(
        'group relative border-2 border-transparent rounded-lg p-4 transition-all duration-200',
        isSelected && 'border-blue-500 bg-blue-50/50',
        'hover:border-blue-300 hover:bg-blue-50/30'
      )}
      onClick={onStartEdit}
    >
      {/* 模块标识 */}
      <div className="flex items-center justify-between mb-2 opacity-100 transition-opacity">
        <div className="flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-purple-600" />
          <Badge variant="secondary" className="text-xs">
            {tEditor('图片模块')}
          </Badge>
        </div>

        {isEditing && module.src && (
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={e => {
                e.stopPropagation()
                onUpdate?.({ src: '', alt: '' })
              }}
              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
              title={tEditor('删除图片')}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* 图片内容 */}
      <div className="w-full" style={{ textAlign: alignment }}>
        {renderImageContent()}
      </div>

      {/* 统一图片选择对话框（仅复用共享组件） */}
      <ImageSelectorDialog
        open={showImageSelector}
        onOpenChange={setShowImageSelector}
        onSelect={handleSelect}
        initialTab="cabinet"
        pageId={usePageStore.getState().currentPage?.id}
      />
    </div>
  )
}
