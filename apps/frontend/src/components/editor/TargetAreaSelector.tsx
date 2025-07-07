'use client'

import { useState, useEffect } from 'react'
import { usePageStore } from '@/stores/usePageStore'
import { useEditorStore } from '@/stores/useEditorStore'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Monitor, Smartphone, Globe } from 'lucide-react'
import { shopService } from '@/services/shopService'

interface TargetArea {
  value: string
  label: string
}

export function TargetAreaSelector() {
  const { targetArea, setTargetArea } = usePageStore()
  const { setError, setLoading } = useEditorStore()

  const [targetAreas, setTargetAreas] = useState<TargetArea[]>([])
  const [isLoadingAreas, setIsLoadingAreas] = useState(true)

  // 获取可用的目标区域
  useEffect(() => {
    const fetchTargetAreas = async () => {
      try {
        setIsLoadingAreas(true)
        const areas = await shopService.getTargetAreas()
        setTargetAreas(areas)
      } catch (error) {
        console.error('获取目标区域失败:', error)
        setError('获取目标区域失败')
        // 设置默认目标区域
        setTargetAreas([
          { value: 'pc', label: 'PC端' },
          { value: 'mobile', label: '移动端' }
        ])
      } finally {
        setIsLoadingAreas(false)
      }
    }

    fetchTargetAreas()
  }, [setError])

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
      <Label className="text-sm font-medium">目标区域:</Label>

      {isLoadingAreas ? (
        <Badge variant="outline" className="animate-pulse">
          加载中...
        </Badge>
      ) : (
        <div className="flex items-center gap-2">
          {/* 当前选中的目标区域显示 */}
          <div className="flex items-center gap-1">
            {getTargetAreaIcon(targetArea)}
            <Badge variant="outline" className="text-xs">
              {currentTargetArea?.label || targetArea}
            </Badge>
          </div>

          {/* 目标区域选择器 */}
          <Select value={targetArea} onValueChange={handleTargetAreaChange}>
            <SelectTrigger className="w-32 h-8">
              <SelectValue placeholder="选择区域" />
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

      {/* 提示信息 */}
      <div className="text-xs text-muted-foreground">当前编辑: {currentTargetArea?.label || targetArea}</div>
    </div>
  )
}
