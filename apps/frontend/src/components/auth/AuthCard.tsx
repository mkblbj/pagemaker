'use client'

import type React from 'react'
import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useTranslation } from '@/contexts/I18nContext'
import { LoginCharacterScene, type LoginSceneState } from '@/components/auth/LoginCharacterScene'
import { BrandLogo, BrandWordmark } from '@/components/common/BrandLogo'

interface AuthCardProps {
  isLoading: boolean
  email: string
  setEmail: (email: string) => void
  password: string
  setPassword: (password: string) => void
  rememberMe: boolean
  setRememberMe: (remember: boolean) => void
  onSignIn: (e: React.FormEvent) => void
  onSocialLogin: (provider: string) => void
  onForgotPassword: () => void
  onSignupPlaceholder: () => void
}

function GoogleGlyph() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 flex-shrink-0" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M21.805 12.23c0-.682-.061-1.337-.175-1.965H12v3.719h5.5a4.704 4.704 0 0 1-2.04 3.086v2.562h3.3c1.93-1.777 3.045-4.397 3.045-7.402Z"
        fill="#4285F4"
      />
      <path
        d="M12 22c2.76 0 5.075-.915 6.767-2.368l-3.3-2.562c-.915.614-2.082.977-3.467.977-2.666 0-4.923-1.8-5.73-4.22H2.86v2.645A10 10 0 0 0 12 22Z"
        fill="#34A853"
      />
      <path
        d="M6.27 13.827A5.99 5.99 0 0 1 5.95 12c0-.635.11-1.252.32-1.827V7.528H2.86A10 10 0 0 0 2 12c0 1.61.384 3.135 1.06 4.472l3.21-2.645Z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.953c1.5 0 2.846.516 3.907 1.527l2.93-2.93C17.07 2.94 14.756 2 12 2A10 10 0 0 0 2.86 7.528l3.41 2.645c.807-2.42 3.064-4.22 5.73-4.22Z"
        fill="#EA4335"
      />
    </svg>
  )
}

export function AuthCard({
  isLoading,
  email,
  setEmail,
  password,
  setPassword,
  rememberMe,
  setRememberMe,
  onSignIn,
  onSocialLogin,
  onForgotPassword,
  onSignupPlaceholder
}: AuthCardProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [emailFocused, setEmailFocused] = useState(false)
  const [passwordFocused, setPasswordFocused] = useState(false)
  const { tAuth } = useTranslation()

  let sceneState: LoginSceneState = 'idle'

  if (showPassword && password.length > 0) {
    sceneState = 'password-visible'
  } else if (emailFocused) {
    sceneState = 'email-focus'
  } else if (passwordFocused) {
    sceneState = 'password-focus'
  }

  return (
    <div className="min-h-full overflow-x-hidden bg-[#f5f4fb] lg:grid lg:min-h-screen lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
      <section
        data-testid="desktop-login-stage"
        className="relative hidden overflow-hidden bg-[linear-gradient(140deg,#6c3ff5_0%,#5a34e8_42%,#3b247c_100%)] px-10 py-10 text-white lg:flex lg:min-h-screen lg:flex-col"
      >
        <div className="relative z-10 flex items-center gap-3">
          <BrandLogo
            containerClassName="rounded-[20px] border-white/20 bg-white/12 p-2"
            className="w-[64px] sm:w-[72px]"
          />
          <BrandWordmark className="text-xl font-semibold tracking-tight text-white sm:text-2xl" />
        </div>

        <div className="relative z-10 mt-12 max-w-[34rem] space-y-5">
          <h1 className="max-w-[12ch] text-[clamp(3rem,5vw,5.25rem)] font-semibold leading-[0.92] tracking-[-0.04em]">
            {tAuth('让页面制作更简单')}
          </h1>
          <p className="max-w-xl text-lg leading-8 text-white/72">{tAuth('可视化搭建和管理乐天店铺页面')}</p>
        </div>

        <div className="relative z-10 flex flex-1 items-end justify-center px-6 pb-8 pt-10">
          <LoginCharacterScene sceneState={sceneState} />
        </div>

        <div className="relative z-10 flex items-center gap-8 text-sm text-white/62">
          <span>{tAuth('隐私政策')}</span>
          <span>{tAuth('服务条款')}</span>
          <span>{tAuth('联系我们')}</span>
        </div>

        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.24),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.14),transparent_35%)]" />
        <div className="pointer-events-none absolute left-[8%] top-[14%] h-36 w-36 rounded-full bg-white/16 blur-3xl" />
        <div className="pointer-events-none absolute bottom-[18%] right-[14%] h-56 w-56 rounded-full bg-[#ffbc6c]/30 blur-3xl" />
      </section>

      <section className="relative flex min-h-screen items-center justify-center bg-[#fcfcfd] px-6 py-20 sm:px-8 lg:px-12">
        <div className="w-full max-w-[430px]">
          <div data-testid="mobile-login-brand" className="mb-10 flex items-center justify-center gap-3 lg:hidden">
            <BrandLogo
              containerClassName="rounded-[18px] border-slate-200/90 bg-white p-1.5 shadow-[0_12px_30px_rgba(15,23,42,0.10)]"
              className="w-[56px]"
            />
            <BrandWordmark className="text-lg text-slate-950" />
          </div>

          <div className="mb-10 space-y-3">
            <h2 className="text-4xl font-semibold tracking-[-0.04em] text-slate-950">{tAuth('欢迎回来')}</h2>
            <p className="text-sm leading-6 text-slate-500">{tAuth('请输入您的登录信息')}</p>
          </div>

          <form onSubmit={onSignIn} className="space-y-5">
            <div className="space-y-2.5">
              <Label htmlFor="login-email" className="text-sm text-slate-700">
                {tAuth('邮箱或用户名')}
              </Label>
              <Input
                id="login-email"
                type="text"
                value={email}
                autoComplete="username"
                onChange={e => setEmail(e.target.value)}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                placeholder={tAuth('邮箱或用户名')}
                className="h-14 rounded-2xl border-slate-200 bg-white px-4 text-[15px] shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all duration-200 placeholder:text-slate-400 focus-visible:border-[#6c3ff5]/60 focus-visible:ring-[#6c3ff5]/20"
              />
            </div>

            <div className="space-y-2.5">
              <Label htmlFor="login-password" className="text-sm text-slate-700">
                {tAuth('密码')}
              </Label>
              <div className="relative">
                <Input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  autoComplete="current-password"
                  onChange={e => setPassword(e.target.value)}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  placeholder={tAuth('请输入密码')}
                  className="h-14 rounded-2xl border-slate-200 bg-white px-4 pr-12 text-[15px] shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all duration-200 placeholder:text-slate-400 focus-visible:border-[#6c3ff5]/60 focus-visible:ring-[#6c3ff5]/20"
                />
                <button
                  type="button"
                  data-testid="login-password-toggle"
                  aria-label={showPassword ? tAuth('隐藏密码') : tAuth('显示密码')}
                  onClick={() => setShowPassword(current => !current)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-700"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <label className="flex cursor-pointer items-center gap-3 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-[#6c3ff5] focus:ring-[#6c3ff5]/20"
                />
                <span>{tAuth('记住我')}</span>
              </label>

              <button
                type="button"
                data-testid="forgot-password-button"
                onClick={onForgotPassword}
                className="text-sm font-medium text-[#6c3ff5] transition-colors hover:text-[#4f2fd6]"
              >
                {tAuth('忘记密码？')}
              </button>
            </div>

            <Button
              type="submit"
              data-testid="login-submit-button"
              disabled={isLoading}
              className="h-14 w-full rounded-2xl bg-[#141a2a] text-base font-medium text-white shadow-[0_12px_32px_rgba(20,26,42,0.18)] transition hover:bg-[#1d2538]"
            >
              {isLoading ? tAuth('登录中...') : tAuth('登录')}
            </Button>
          </form>

          <div className="my-7 flex items-center gap-4">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs font-medium uppercase tracking-[0.24em] text-slate-400">{tAuth('或继续使用')}</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <Button
            type="button"
            variant="outline"
            data-testid="google-login-button"
            onClick={() => onSocialLogin('Google')}
            className="h-14 w-full rounded-2xl border-slate-200 bg-white text-[15px] font-medium text-slate-800 shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:bg-slate-50"
          >
            <GoogleGlyph />
            {tAuth('使用 Google 登录')}
          </Button>

          <div className="mt-8 text-center text-sm text-slate-500">
            {tAuth('还没有账户？')}{' '}
            <button
              type="button"
              data-testid="signup-placeholder-button"
              onClick={onSignupPlaceholder}
              className="font-semibold text-slate-900 transition-colors hover:text-[#6c3ff5]"
            >
              {tAuth('创建账户')}
            </button>
          </div>

          <p className="mt-5 text-center text-xs leading-6 text-slate-400">{tAuth('登录即表示您同意我们的服务条款')}</p>
        </div>
      </section>
    </div>
  )
}
