// This is a placeholder implementation for the toast hook
// In a real application, you would use a proper toast library like sonner or react-hot-toast

import { useState, useCallback } from 'react'

export interface ToastProps {
  id?: string
  title?: string
  description?: string
  variant?: 'default' | 'destructive'
  action?: React.ReactNode
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastProps[]>([])

  const toast = useCallback((props: ToastProps) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast = { ...props, id }

    setToasts(prev => [...prev, newToast])

    // Auto remove after 5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 5000)

    // For now, just log to console
    console.log('Toast:', props)
  }, [])

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return {
    toast,
    dismiss,
    toasts
  }
}
