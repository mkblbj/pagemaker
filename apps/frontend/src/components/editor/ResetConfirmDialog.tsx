'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RotateCcw, AlertTriangle } from 'lucide-react'
import { useTranslation } from '@/contexts/I18nContext'

interface ResetConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function ResetConfirmDialog({
  open,
  onOpenChange,
  onConfirm
}: ResetConfirmDialogProps) {
  const { tEditor } = useTranslation()

  const handleConfirm = () => {
    onConfirm()
    onOpenChange(false)
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <DialogTitle>{tEditor('重置页面确认')}</DialogTitle>
              <DialogDescription className="mt-1">{tEditor('此操作将清除所有模块，无法撤销。')}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{tEditor('您确定要清除所有模块吗？清除后将无法恢复。')}</AlertDescription>
          </Alert>

          <div className="mt-4 p-3 bg-yellow-50 rounded-lg text-sm border border-yellow-200">
            <div className="font-medium text-yellow-800 mb-1">{tEditor('重置操作将：')}</div>
            <ul className="text-yellow-700 space-y-1">
              <li>• {tEditor('删除页面中的所有模块')}</li>
              <li>• {tEditor('清空页面内容')}</li>
              <li>• {tEditor('保留页面基本信息')}</li>
            </ul>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleCancel}>
            {tEditor('取消')}
          </Button>
          <Button variant="destructive" onClick={handleConfirm} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            {tEditor('确认重置')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 