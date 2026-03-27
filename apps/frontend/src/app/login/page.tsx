'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { Toaster } from '@/components/ui/toaster'
import { AuthCard } from '@/components/auth/AuthCard'
import { useAuth } from '@/hooks/useAuth'
import { useTranslation } from '@/contexts/I18nContext'
import { LanguageCompact } from '@/components/common/LanguageSwitcher'
import { BRAND_LOGIN_DESCRIPTION } from '@/lib/brand'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const { signIn, socialSignIn, forgotPassword, isLoading } = useAuth()
  const { tAuth } = useTranslation()

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()

    const result = await signIn({ email, password, rememberMe })

    if (result.success) {
      toast({
        title: tAuth('登录成功！'),
        description: BRAND_LOGIN_DESCRIPTION
      })
      router.push('/dashboard')
      return
    }

    toast({
      title: tAuth('登录失败'),
      description: result.error || tAuth('请检查您的邮箱和密码'),
      variant: 'destructive'
    })
  }

  const handleSocialLogin = async (provider: string) => {
    const result = await socialSignIn(provider)

    if (result.success) {
      toast({
        title: `${provider} ${tAuth('登录成功')}`,
        description: tAuth('正在跳转...')
      })
      router.push('/dashboard')
      return
    }

    toast({
      title: `${provider} ${tAuth('登录')}`,
      description: result.error || tAuth('功能开发中...'),
      variant: 'destructive'
    })
  }

  const handleForgotPassword = async () => {
    if (!email) {
      toast({
        title: tAuth('请输入邮箱'),
        description: tAuth('请先输入您的邮箱地址'),
        variant: 'destructive'
      })
      return
    }

    const result = await forgotPassword(email)

    if (result.success) {
      toast({
        title: tAuth('重置链接已发送'),
        description: tAuth('请查看您的邮箱以获取密码重置说明')
      })
      return
    }

    toast({
      title: tAuth('发送失败'),
      description: result.error || tAuth('请稍后重试'),
      variant: 'destructive'
    })
  }

  const handleSignupPlaceholder = () => {
    toast({
      title: tAuth('注册功能即将上线'),
      description: tAuth('请先使用已有账户登录')
    })
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="fixed right-4 top-4 z-50 rounded-full border border-slate-200/80 bg-white/85 p-1 shadow-[0_10px_30px_rgba(15,23,42,0.08)] backdrop-blur">
        <LanguageCompact />
      </div>

      <AuthCard
        isLoading={isLoading}
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        rememberMe={rememberMe}
        setRememberMe={setRememberMe}
        onSignIn={handleSignIn}
        onSocialLogin={handleSocialLogin}
        onForgotPassword={handleForgotPassword}
        onSignupPlaceholder={handleSignupPlaceholder}
      />
      <Toaster />
    </div>
  )
}
