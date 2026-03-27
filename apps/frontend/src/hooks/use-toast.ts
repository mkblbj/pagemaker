import { useCallback, useEffect, useState } from 'react'
import { toastManager, type ToastProps as ManagedToastProps } from '@/components/ui/toast'

export interface ToastProps {
  id?: string
  title?: string
  description?: string
  variant?: 'default' | 'destructive'
  action?: React.ReactNode
}

function mapManagedToast(toast: ManagedToastProps): ToastProps {
  return {
    id: toast.id,
    title: toast.title,
    description: toast.description,
    variant: toast.type === 'error' ? 'destructive' : 'default'
  }
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastProps[]>([])

  useEffect(() => {
    return toastManager.subscribe(nextToasts => {
      setToasts(nextToasts.map(mapManagedToast))
    })
  }, [])

  const toast = useCallback((props: ToastProps) => {
    return toastManager.show({
      type: props.variant === 'destructive' ? 'error' : 'info',
      title: props.title ?? props.description ?? '',
      description: props.description,
      duration: 5000
    })
  }, [])

  const dismiss = useCallback((id: string) => {
    toastManager.remove(id)
  }, [])

  return {
    toast,
    dismiss,
    toasts
  }
}
