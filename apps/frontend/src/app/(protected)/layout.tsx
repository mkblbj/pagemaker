'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { apiClient } from '@/lib/apiClient'
import { useTranslation } from '@/contexts/I18nContext'
import { LanguageCompact } from '@/components/common/LanguageSwitcher'
import { ApiExpiryReminder } from '@/components/common/ApiExpiryReminder'
import { BrandLogo, BrandWordmark } from '@/components/common/BrandLogo'
import { BRAND_NAME } from '@/lib/brand'

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const router = useRouter()
  const pathname = usePathname()
  const { tAuth, tCommon } = useTranslation()

  const isEditorPage = pathname?.includes('/editor/')

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('access_token')

      if (!token) {
        setIsAuthenticated(false)
        return
      }

      try {
        await apiClient.get('/api/v1/pages/')
        setIsAuthenticated(true)
      } catch (error: any) {
        console.error('Auth check failed:', error)
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        setIsAuthenticated(false)
      }
    }

    checkAuth()
  }, [])

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">{tAuth('检查认证状态...')}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!isAuthenticated) {
    router.push('/login')
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-4">{tAuth('需要登录')}</h2>
              <p className="text-muted-foreground mb-4">{tAuth('正在跳转到登录页面...')}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card flex-shrink-0">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <Link href="/dashboard" aria-label={BRAND_NAME} className="flex items-center gap-3">
              <BrandLogo
                containerClassName="rounded-xl border-slate-200/80 bg-white p-1.5 shadow-sm"
                className="w-[44px] sm:w-[52px]"
              />
              <BrandWordmark className="text-lg text-foreground sm:text-xl" />
            </Link>
            <nav className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-muted-foreground hover:text-foreground">
                {tCommon('仪表板')}
              </Link>
              <Link href="/pages" className="text-muted-foreground hover:text-foreground">
                {tCommon('页面管理')}
              </Link>
              <Link href="/shop-configurations" className="text-muted-foreground hover:text-foreground">
                {tCommon('店铺配置')}
              </Link>
              <LanguageCompact />
              <button
                onClick={() => {
                  localStorage.removeItem('access_token')
                  localStorage.removeItem('refresh_token')
                  router.push('/login')
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                {tAuth('退出')}
              </button>
            </nav>
          </div>
        </div>
      </header>
      <main className={`flex-1 overflow-hidden ${isEditorPage ? '' : 'container mx-auto px-4 py-8 overflow-y-auto'}`}>
        {children}
      </main>

      <ApiExpiryReminder />
    </div>
  )
}
