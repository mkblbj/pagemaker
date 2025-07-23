'use client'

import { Layout } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { PageModule, PageModuleType, KeyValueModuleConfig } from '@pagemaker/shared-types'
import { useTranslation } from '@/contexts/I18nContext'

interface KeyValueModuleProps {
  module: PageModule & KeyValueModuleConfig
  isSelected?: boolean
  isEditing?: boolean
  onUpdate?: (updates: Partial<PageModule>) => void
  onStartEdit?: () => void
  onEndEdit?: () => void
}

export function KeyValueModule({
  module,
  isSelected = false,
  isEditing = false,
  onUpdate,
  onStartEdit,
  onEndEdit
}: KeyValueModuleProps) {
  const { tEditor } = useTranslation()

  // 获取键值对模块的配置
  const rows = module.rows || (module as any).pairs || [{ key: tEditor('键'), value: tEditor('值') }]
  const labelBackgroundColor = module.labelBackgroundColor || '#f3f4f6'
  const textColor = module.textColor || '#374151'

  // 确保至少有一行数据用于显示
  const displayRows = rows.length > 0 ? rows : [{ key: tEditor('键'), value: tEditor('值') }]

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
      <div className="flex items-center gap-2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Layout className="h-4 w-4 text-gray-600" />
        <Badge variant="secondary" className="text-xs">
          {tEditor('键值对表格')} ({rows.length} {tEditor('行')})
        </Badge>
      </div>

      {/* 键值对表格内容 */}
      <div className="w-full">
        <table className="w-full border-collapse border border-gray-300">
          <tbody>
            {displayRows.map((row, index) => (
              <tr key={index}>
                <td
                  className="border border-gray-300 px-3 py-2 font-medium"
                  style={{
                    backgroundColor: labelBackgroundColor,
                    color: textColor
                  }}
                >
                  {row.key}
                </td>
                <td className="border border-gray-300 px-3 py-2" style={{ color: textColor }}>
                  {row.value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 编辑状态下的提示 */}
      {/* {isEditing && (
        <div className="absolute inset-0 flex items-center justify-center bg-blue-50/80 rounded-lg border-2 border-blue-300 border-dashed">
          <div className="text-sm text-blue-600 font-medium">
            {tEditor('在右侧属性面板中配置键值对内容')}
          </div>
        </div>
      )} */}
    </div>
  )
}
