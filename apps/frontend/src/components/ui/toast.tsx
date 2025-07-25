'use client'

import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Check, X, AlertCircle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ToastProps {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  description?: string
  duration?: number
  onClose: (id: string) => void
}

export function Toast({ id, type, title, description, duration = 3000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)

  const handleClose = useCallback(() => {
    setIsLeaving(true)
    setTimeout(() => {
      onClose(id)
    }, 300)
  }, [id, onClose])

  useEffect(() => {
    // 延迟显示动画
    const showTimer = setTimeout(() => setIsVisible(true), 50)

    // 自动关闭
    const closeTimer = setTimeout(() => {
      handleClose()
    }, duration)

    return () => {
      clearTimeout(showTimer)
      clearTimeout(closeTimer)
    }
  }, [duration, handleClose])

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <Check className="h-4 w-4" />
      case 'error':
        return <X className="h-4 w-4" />
      case 'warning':
        return <AlertCircle className="h-4 w-4" />
      case 'info':
        return <Info className="h-4 w-4" />
    }
  }

  const getStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800'
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800'
    }
  }

  const getIconStyles = () => {
    switch (type) {
      case 'success':
        return 'text-green-500'
      case 'error':
        return 'text-red-500'
      case 'warning':
        return 'text-yellow-500'
      case 'info':
        return 'text-blue-500'
    }
  }

  return createPortal(
    <div
      className={cn(
        'fixed top-4 right-4 z-50 w-80 max-w-sm rounded-lg border p-4 shadow-lg transition-all duration-300',
        getStyles(),
        isVisible && !isLeaving ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      )}
    >
      <div className="flex gap-3">
        <div className={cn('flex-shrink-0', getIconStyles())}>{getIcon()}</div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm">{title}</div>
          {description && <div className="text-xs mt-1 opacity-90">{description}</div>}
        </div>
        <button onClick={handleClose} className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity">
          <X className="h-3 w-3" />
        </button>
      </div>
    </div>,
    document.body
  )
}

// Toast管理器
class ToastManager {
  private toasts: ToastProps[] = []
  private listeners: Array<(toasts: ToastProps[]) => void> = []

  subscribe(listener: (toasts: ToastProps[]) => void) {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  private notify() {
    this.listeners.forEach(listener => listener(this.toasts))
  }

  show(toast: Omit<ToastProps, 'id' | 'onClose'>) {
    const id = Math.random().toString(36).substring(2, 9)
    const newToast: ToastProps = {
      ...toast,
      id,
      onClose: this.remove.bind(this)
    }

    this.toasts.push(newToast)
    this.notify()

    return id
  }

  remove(id: string) {
    this.toasts = this.toasts.filter(toast => toast.id !== id)
    this.notify()
  }

  clear() {
    this.toasts = []
    this.notify()
  }
}

export const toastManager = new ToastManager()

// React Hook
export function useToast() {
  const [toasts, setToasts] = useState<ToastProps[]>([])

  useEffect(() => {
    return toastManager.subscribe(setToasts)
  }, [])

  return {
    toasts,
    toast: {
      success: (title: string, description?: string, duration?: number) =>
        toastManager.show({ type: 'success', title, description, duration }),
      error: (title: string, description?: string, duration?: number) =>
        toastManager.show({ type: 'error', title, description, duration }),
      warning: (title: string, description?: string, duration?: number) =>
        toastManager.show({ type: 'warning', title, description, duration }),
      info: (title: string, description?: string, duration?: number) =>
        toastManager.show({ type: 'info', title, description, duration })
    }
  }
}

// Toast容器组件
export function ToastContainer() {
  const { toasts } = useToast()

  return (
    <>
      {toasts.map(toast => (
        <Toast key={toast.id} {...toast} />
      ))}
    </>
  )
}
