'use client'

import { Minus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { PageModule, PageModuleType } from '@pagemaker/shared-types'
import { useTranslation } from '@/contexts/I18nContext'

interface SeparatorModuleProps {
  module: PageModule & {
    separatorType?: 'line' | 'space'
    lineStyle?: 'solid' | 'dashed' | 'dotted'
    lineColor?: string
    lineThickness?: number
    spaceHeight?: 'small' | 'medium' | 'large' | 'extra-large'
  }
  isSelected?: boolean
  isEditing?: boolean
  onUpdate?: (updates: Partial<PageModule>) => void
  onStartEdit?: () => void
  onEndEdit?: () => void
}

// 空白间距高度映射
const SPACE_HEIGHT_MAP = {
  small: '20px',
  medium: '40px',
  large: '60px',
  'extra-large': '80px'
} as const

export function SeparatorModule({
  module,
  isSelected = false,
  isEditing = false,
  onUpdate,
  onStartEdit,
  onEndEdit
}: SeparatorModuleProps) {
  const { tEditor } = useTranslation()

  // 获取分隔模块的默认配置
  const separatorType = module.separatorType || 'line'
  const lineStyle = module.lineStyle || 'solid'
  const lineColor = module.lineColor || '#e5e7eb'
  const lineThickness = module.lineThickness || 1
  const spaceHeight = module.spaceHeight || 'medium'

  // 渲染线条分隔
  const renderLineSeparator = () => {
    const borderStyle = {
      borderTopWidth: `${lineThickness}px`,
      borderTopStyle: lineStyle,
      borderTopColor: lineColor
    }

    return <div className="w-full" style={borderStyle} role="separator" aria-label={tEditor('线条分隔')} />
  }

  // 渲染空白间距
  const renderSpaceSeparator = () => {
    const height = SPACE_HEIGHT_MAP[spaceHeight]

    return <div className="w-full" style={{ height }} role="separator" aria-label={tEditor('空白间距')} />
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
      <div className="flex items-center gap-2 mb-2 opacity-100 transition-opacity">
        <Minus className="h-4 w-4 text-gray-600" />
        <Badge variant="secondary" className="text-xs">
          {tEditor('分隔模块')} - {separatorType === 'line' ? tEditor('线条') : tEditor('空白')}
        </Badge>
      </div>

      {/* 分隔内容 */}
      <div className="w-full">{separatorType === 'line' ? renderLineSeparator() : renderSpaceSeparator()}</div>

      {/* 编辑状态下的提示 */}
      {/* {isEditing && (
        <div className="absolute inset-0 flex items-center justify-center bg-blue-50/80 rounded-lg border-2 border-blue-300 border-dashed">
          <div className="text-sm text-blue-600 font-medium">
            {tEditor('在右侧属性面板中配置分隔样式')}
          </div>
        </div>
      )} */}
    </div>
  )
}
