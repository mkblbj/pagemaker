import { fireEvent, render, screen } from '@/test-utils'
import { useToast } from '@/hooks/use-toast'
import { Toaster } from '@/components/ui/toaster'
import { toastManager } from '@/components/ui/toast'

function ToastTrigger() {
  const { toast } = useToast()

  return (
    <button
      type="button"
      onClick={() =>
        toast({
          title: '注册功能即将上线',
          description: '请先使用已有账户登录'
        })
      }
    >
      show toast
    </button>
  )
}

describe('Toaster', () => {
  beforeEach(() => {
    toastManager.clear()
  })

  afterEach(() => {
    toastManager.clear()
  })

  it('应该渲染 useToast 触发的提示内容', () => {
    const { unmount } = render(
      <>
        <ToastTrigger />
        <Toaster />
      </>
    )

    fireEvent.click(screen.getByRole('button', { name: 'show toast' }))

    expect(screen.getByText('注册功能即将上线')).toBeInTheDocument()
    expect(screen.getByText('请先使用已有账户登录')).toBeInTheDocument()

    unmount()
  })
})
