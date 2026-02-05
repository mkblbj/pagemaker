'use client'

import { useCallback } from 'react'
import { Table, Plus, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { PageModule, KeyValueModuleConfig } from '@pagemaker/shared-types'
import { useTranslation } from '@/contexts/I18nContext'
import { EditableCustomHTMLRenderer } from '@/components/editor/EditableCustomHTMLRenderer'

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
  onEndEdit: _onEndEdit
}: KeyValueModuleProps) {
  const { tEditor } = useTranslation()

  // 获取表格模块的配置
  const rows = module.rows || (module as any).pairs || [{ key: tEditor('键'), value: tEditor('值') }]

  // 确保至少有一行数据用于显示
  const displayRows = rows.length > 0 ? rows : [{ key: tEditor('键'), value: tEditor('值') }]

  // 将 rows 数据转换为 HTML 表格
  const generateTableHTML = useCallback(() => {
    const tableRows = displayRows
      .map((row: { key: string; value: string }) => {
        const key = row.key || ''
        const value = row.value || ''
        return `<tr><td colspan="6" bgcolor="#efefef" width="20%" align="center">${key}</td><td bgcolor="#FFFFFF" width="80%">${value}</td></tr>`
      })
      .join('')

    return `<table width="100%" border="0" cellspacing="2" cellpadding="8" bgcolor="#999999">${tableRows}</table>`
  }, [displayRows])

  // 从 HTML 表格解析回 rows 数据
  const parseTableHTML = useCallback((html: string) => {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    const tableRows = doc.querySelectorAll('tr')

    const newRows: Array<{ key: string; value: string }> = []
    tableRows.forEach((tr) => {
      const cells = tr.querySelectorAll('td')
      if (cells.length >= 2) {
        newRows.push({
          key: cells[0].innerHTML || '',
          value: cells[1].innerHTML || ''
        })
      }
    })

    return newRows.length > 0 ? newRows : [{ key: '', value: '' }]
  }, [])

  // 处理 HTML 更新
  const handleHTMLUpdate = useCallback((html: string) => {
    if (!onUpdate) return
    const newRows = parseTableHTML(html)
    onUpdate({ rows: newRows })
  }, [onUpdate, parseTableHTML])

  // 添加新行
  const handleAddRow = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (!onUpdate) return

    const newRows = [...displayRows, { key: tEditor('新键'), value: tEditor('新值') }]
    onUpdate({ rows: newRows })
  }, [onUpdate, displayRows, tEditor])

  // 删除最后一行
  const handleRemoveLastRow = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (!onUpdate) return
    if (displayRows.length <= 1) return // 至少保留一行

    const newRows = displayRows.slice(0, -1)
    onUpdate({ rows: newRows })
  }, [onUpdate, displayRows])

  return (
    <div
      className={cn(
        'group relative border-2 border-transparent rounded-lg transition-all duration-200',
        isSelected && 'border-blue-500 bg-blue-50/50',
        'hover:border-blue-300 hover:bg-blue-50/30'
      )}
      onClick={onStartEdit}
    >
      {/* 模块标识 */}
      <div className="flex items-center gap-2 mb-2 px-4 pt-4">
        <Table className="h-4 w-4 text-gray-600" />
        <Badge variant="secondary" className="text-xs">
          {tEditor('键值对表格')} ({displayRows.length} {tEditor('行')})
        </Badge>
      </div>

      {/* 使用 EditableCustomHTMLRenderer 渲染和编辑表格 - 无 padding 确保表格全宽 */}
      <div className="w-full">
        <EditableCustomHTMLRenderer
          html={generateTableHTML()}
          isEditing={isEditing}
          onUpdate={handleHTMLUpdate}
        />
      </div>

      {/* 操作按钮 - 底部显示，选中或悬停时可见 */}
      <div className={cn(
        "flex items-center justify-center gap-2 mt-3 pt-2 border-t border-gray-200 transition-opacity",
        isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
      )}>
        <Button
          variant="outline"
          size="sm"
          onClick={handleAddRow}
          className="h-7 px-3 text-xs"
          title={tEditor('添加键值对')}
        >
          <Plus className="h-3 w-3 mr-1" />
          {tEditor('添加')}
        </Button>
        {displayRows.length > 1 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRemoveLastRow}
            className="h-7 px-3 text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
            title={tEditor('删除')}
          >
            <Trash2 className="h-3 w-3 mr-1" />
            {tEditor('删除')}
          </Button>
        )}
      </div>

      {/* 编辑提示 */}
      {isSelected && !isEditing && (
        <div className="mt-2 text-xs text-gray-500 text-center">
          {tEditor('单击内容编辑')}
        </div>
      )}
    </div>
  )
}
