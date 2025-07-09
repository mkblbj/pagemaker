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
import { Trash2, AlertTriangle } from 'lucide-react'

interface DeleteConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  moduleName?: string
  moduleType?: string
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  moduleName,
  moduleType
}: DeleteConfirmDialogProps) {
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
              <DialogTitle>删除模块确认</DialogTitle>
              <DialogDescription className="mt-1">此操作无法撤销，请确认是否继续。</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>您确定要删除这个模块吗？删除后将无法恢复。</AlertDescription>
          </Alert>

          {(moduleName || moduleType) && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm">
              <div className="font-medium text-gray-700 mb-1">模块信息：</div>
              {moduleType && <div>类型：{moduleType}</div>}
              {moduleName && <div>名称：{moduleName}</div>}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleCancel}>
            取消
          </Button>
          <Button variant="destructive" onClick={handleConfirm} className="gap-2">
            <Trash2 className="h-4 w-4" />
            确认删除
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
