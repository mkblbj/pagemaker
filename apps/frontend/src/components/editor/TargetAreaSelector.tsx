'use client'

import { useState, useEffect } from 'react'
import { usePageStore } from '@/stores/usePageStore'
import { useEditorStore } from '@/stores/useEditorStore'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Monitor, Smartphone, Globe } from 'lucide-react'
import { shopService } from '@/services/shopService'
import { useTranslation } from '@/contexts/I18nContext'

interface TargetArea {
  value: string
  label: string
}

export function TargetAreaSelector() {
  const { targetArea, setTargetArea } = usePageStore()
  const { setError } = useEditorStore()
  const { tEditor, currentLanguage } = useTranslation()
  const [targetAreas, setTargetAreas] = useState<TargetArea[]>([])
  const [isLoadingAreas, setIsLoadingAreas] = useState(true)

  // 获取可用的目标区域
  useEffect(() => {
    const fetchTargetAreas = async () => {
      try {
        setIsLoadingAreas(true)
        const areas = await shopService.getTargetAreas(currentLanguage)
        setTargetAreas(areas)
      } catch (error) {
        console.error('获取目标区域失败:', error)
        setError('获取目标区域失败')
        // 设置默认目标区域
        setTargetAreas([
          { value: 'pc', label: tEditor('PC端') },
          { value: 'mobile', label: tEditor('移动端') }
        ])
      } finally {
        setIsLoadingAreas(false)
      }
    }

    fetchTargetAreas()
  }, [setError, tEditor, currentLanguage])

  // 处理目标区域切换
  const handleTargetAreaChange = (newTargetArea: string) => {
    setTargetArea(newTargetArea)

    // 保存到localStorage作为用户偏好
    if (typeof window !== 'undefined') {
      localStorage.setItem('preferred_target_area', newTargetArea)
    }
  }

  // 获取目标区域图标
  const getTargetAreaIcon = (area: string) => {
    switch (area) {
      case 'pc':
        return <Monitor className="h-4 w-4" />
      case 'mobile':
        return <Smartphone className="h-4 w-4" />
      default:
        return <Globe className="h-4 w-4" />
    }
  }

  // 获取当前选中的目标区域信息
  const currentTargetArea = targetAreas?.find(area => area.value === targetArea)

  return (
    <div className="flex items-center gap-3" data-testid="target-area-selector">
      <Label className="text-sm font-medium">{tEditor('目标区域')}:</Label>

      {isLoadingAreas ? (
        <Badge variant="outline" className="animate-pulse">
          {tEditor('加载中')}...
        </Badge>
      ) : (
        <div className="flex items-center gap-2">
          {/* 目标区域选择器 - 集成显示和选择功能 */}
          <Select value={targetArea} onValueChange={handleTargetAreaChange}>
            <SelectTrigger className="w-36 h-8 border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700">
              <div className="flex items-center gap-2">
                {getTargetAreaIcon(targetArea)}
                <span className="text-sm font-medium">{currentTargetArea?.label || targetArea}</span>
              </div>
            </SelectTrigger>
            <SelectContent>
              {targetAreas?.map(area => (
                <SelectItem key={area.value} value={area.value}>
                  <div className="flex items-center gap-2">
                    {getTargetAreaIcon(area.value)}
                    <span>{area.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  )
}
