import userEvent from '@testing-library/user-event'
import { render, screen, waitFor } from '@/test-utils'
import LoginPage from './page'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/use-toast'

const mockPush = vi.fn()
const mockToast = vi.fn()
const mockSignIn = vi.fn()
const mockSocialSignIn = vi.fn()
const mockForgotPassword = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush
  })
}))

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn()
}))

vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn()
}))

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockSignIn.mockResolvedValue({ success: true })
    mockSocialSignIn.mockResolvedValue({ success: false, error: 'Google 登录功能正在开发中' })
    mockForgotPassword.mockResolvedValue({ success: true })

    vi.mocked(useToast).mockReturnValue({
      toast: mockToast,
      dismiss: vi.fn(),
      toasts: []
    })

    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      error: null,
      signIn: mockSignIn,
      signUp: vi.fn(),
      signOut: vi.fn(),
      forgotPassword: mockForgotPassword,
      socialSignIn: mockSocialSignIn,
      checkAuthStatus: vi.fn()
    })
  })

  it('应该渲染新的双栏登录布局结构', () => {
    render(<LoginPage />)

    expect(screen.getByText('欢迎回来')).toBeInTheDocument()
    expect(screen.getAllByText('UO-PageMaker')).toHaveLength(2)
    expect(screen.getByTestId('desktop-login-stage')).toHaveClass('hidden', 'lg:flex')
    expect(screen.getByTestId('mobile-login-brand')).toHaveClass('lg:hidden')
    expect(screen.getByTestId('login-character-scene')).toHaveAttribute('data-scene-state', 'idle')
  })

  it('应该在邮箱输入聚焦和密码显隐时更新角色场景状态', async () => {
    const user = userEvent.setup()

    render(<LoginPage />)

    const scene = screen.getByTestId('login-character-scene')
    const emailInput = screen.getByLabelText('邮箱或用户名')
    const passwordInput = screen.getByLabelText('密码')

    await user.click(emailInput)
    expect(scene).toHaveAttribute('data-scene-state', 'email-focus')

    await user.type(passwordInput, 'secret123')
    await user.click(screen.getByTestId('login-password-toggle'))

    expect(passwordInput).toHaveAttribute('type', 'text')
    expect(scene).toHaveAttribute('data-scene-state', 'password-visible')
    expect(scene).toHaveAttribute('data-password-visible', 'true')
  })

  it('应该触发忘记密码、Google 占位登录和注册占位提示', async () => {
    const user = userEvent.setup()

    render(<LoginPage />)

    await user.type(screen.getByLabelText('邮箱或用户名'), 'anna@example.com')
    await user.click(screen.getByTestId('forgot-password-button'))

    await waitFor(() => {
      expect(mockForgotPassword).toHaveBeenCalledWith('anna@example.com')
    })

    await user.click(screen.getByTestId('google-login-button'))

    await waitFor(() => {
      expect(mockSocialSignIn).toHaveBeenCalledWith('Google')
    })

    await user.click(screen.getByTestId('signup-placeholder-button'))

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: '注册功能即将上线',
        description: '请先使用已有账户登录'
      })
    )
  })

  it('登录成功后应该提示成功并跳转到仪表板', async () => {
    const user = userEvent.setup()

    mockSignIn.mockResolvedValueOnce({ success: true })

    render(<LoginPage />)

    await user.type(screen.getByLabelText('邮箱或用户名'), 'admin')
    await user.type(screen.getByLabelText('密码'), 'admin123')
    await user.click(screen.getByTestId('login-submit-button'))

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith({
        email: 'admin',
        password: 'admin123',
        rememberMe: false
      })
    })

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: '登录成功！',
        description: '欢迎回到 UO-PageMaker'
      })
    )
    expect(mockPush).toHaveBeenCalledWith('/dashboard')
  })

  it('登录失败后应该展示错误提示且不跳转', async () => {
    const user = userEvent.setup()

    mockSignIn.mockResolvedValueOnce({ success: false, error: '邮箱或密码错误' })

    render(<LoginPage />)

    await user.type(screen.getByLabelText('邮箱或用户名'), 'admin')
    await user.type(screen.getByLabelText('密码'), 'wrong-password')
    await user.click(screen.getByTestId('login-submit-button'))

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '登录失败',
          description: '邮箱或密码错误',
          variant: 'destructive'
        })
      )
    })

    expect(mockPush).not.toHaveBeenCalled()
  })
})
