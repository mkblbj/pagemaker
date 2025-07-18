'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { apiClient } from '@/lib/apiClient'
import { useTranslation } from '@/contexts/I18nContext'
import { LanguageCompact } from '@/components/common/LanguageSwitcher'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const { tAuth, tError } = useTranslation()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      // 调用真实的JWT认证API
      const response = await apiClient.post('/api/v1/auth/token/', {
        username,
        password
      })

      if (response.data.access && response.data.refresh) {
        // 存储JWT tokens
        localStorage.setItem('access_token', response.data.access)
        localStorage.setItem('refresh_token', response.data.refresh)

        // 跳转到dashboard
        router.push('/dashboard')
      } else {
        setError(tError('登录响应格式错误'))
      }
    } catch (err: any) {
      console.error('Login error:', err)
      if (err.response?.status === 401) {
        setError(tAuth('用户名或密码错误'))
      } else if (err.response?.status === 400) {
        setError(tAuth('请填写完整的用户名和密码'))
      } else {
        setError(tAuth('登录失败，请稍后重试'))
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      {/* 语言切换器 - 固定在右上角 */}
      <div className="fixed top-4 right-4 z-50">
        <LanguageCompact />
      </div>

      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{tAuth('登录 Pagemaker CMS')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="username">{tAuth('用户名')}</Label>
              <Input
                id="username"
                type="text"
                placeholder={tAuth('请输入用户名')}
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{tAuth('密码')}</Label>
              <Input
                id="password"
                type="password"
                placeholder={tAuth('请输入密码')}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? tAuth('登录中...') : tAuth('登录')}
            </Button>
            <div className="text-sm text-muted-foreground text-center mt-4">
              <p>{tAuth('测试账号: admin / admin123')}</p>
              <p>{tAuth('或者: testuser / testpass123')}</p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
