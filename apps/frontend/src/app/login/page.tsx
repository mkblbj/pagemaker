'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { Toaster } from '@/components/ui/toaster'
import { AuthCard } from '@/components/auth/AuthCard'
import { useAuth } from '@/hooks/useAuth'
import { useTranslation } from '@/contexts/I18nContext'
import { LanguageCompact } from '@/components/common/LanguageSwitcher'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const { signIn, signUp, socialSignIn, forgotPassword, isLoading } = useAuth()
  const { tAuth } = useTranslation()

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()

    // 暂时取消邮箱格式验证，开发阶段使用
    // if (!validateEmail(email)) {
    //   toast({
    //     title: tAuth('邮箱格式错误'),
    //     description: tAuth('请输入有效的邮箱地址'),
    //     variant: "destructive",
    //   })
    //   return
    // }

    const result = await signIn({ email, password, rememberMe })

    if (result.success) {
      toast({
        title: tAuth('登录成功！'),
        description: tAuth('欢迎回到 Pagemaker CMS')
      })
      router.push('/dashboard')
    } else {
      toast({
        title: tAuth('登录失败'),
        description: result.error || tAuth('请检查您的邮箱和密码'),
        variant: 'destructive'
      })
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()

    // 暂时取消邮箱格式验证，开发阶段使用
    // if (!validateEmail(email)) {
    //   toast({
    //     title: tAuth('邮箱格式错误'),
    //     description: tAuth('请输入有效的邮箱地址'),
    //     variant: "destructive",
    //   })
    //   return
    // }

    if (password.length < 6) {
      toast({
        title: tAuth('密码过短'),
        description: tAuth('密码至少需要6个字符'),
        variant: 'destructive'
      })
      return
    }

    const result = await signUp({ email, password })

    if (result.success) {
      toast({
        title: tAuth('注册成功！'),
        description: tAuth('您的账户已创建成功')
      })
      router.push('/dashboard')
    } else {
      toast({
        title: tAuth('注册失败'),
        description: result.error || tAuth('请检查您的信息'),
        variant: 'destructive'
      })
    }
  }

  const handleSocialLogin = async (provider: string) => {
    const result = await socialSignIn(provider)

    if (result.success) {
      toast({
        title: `${provider} ${tAuth('登录成功')}`,
        description: tAuth('正在跳转...')
      })
      router.push('/dashboard')
    } else {
      toast({
        title: `${provider} ${tAuth('登录')}`,
        description: result.error || tAuth('功能开发中...')
      })
    }
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
    } else {
      toast({
        title: tAuth('发送失败'),
        description: result.error || tAuth('请稍后重试'),
        variant: 'destructive'
      })
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundImage: "url('/bg.jpeg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* 语言切换器 - 固定在右上角 */}
      <div className="fixed top-4 right-4 z-50">
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
        onSignUp={handleSignUp}
        onSocialLogin={handleSocialLogin}
        onForgotPassword={handleForgotPassword}
      />
      <Toaster />
    </div>
  )
}
