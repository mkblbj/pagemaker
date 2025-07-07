'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { useTranslation } from '@/contexts/I18nContext'
import { LanguageSwitcher, LanguageCompact } from '@/components/common/LanguageSwitcher'
import { handleError, getUserFriendlyMessage } from '@/lib/errorHandler'
import { AlertCircle, CheckCircle, Info, Wifi, WifiOff } from 'lucide-react'

/**
 * 多语言功能演示页面
 */
export default function I18nDemoPage() {
  const { currentLanguage, tError, tCommon } = useTranslation()

  // 模拟错误处理
  const simulateError = (errorCode: string) => {
    const mockError = new Error(`Mock ${errorCode}`)
    const appError = handleError(mockError, { source: 'demo' }, currentLanguage)
    alert(`错误代码: ${appError.code}\n用户消息: ${appError.userMessage}`)
  }

  // 模拟网络错误
  const simulateNetworkError = () => {
    const networkError = {
      response: { status: 500 },
      message: 'Network connection failed'
    }
    const friendlyMessage = getUserFriendlyMessage(networkError, currentLanguage)
    alert(`网络错误消息: ${friendlyMessage}`)
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* 页面标题 */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">{tCommon('i18n_demo_title')}</h1>
        <p className="text-muted-foreground">{tCommon('i18n_demo_description')}</p>
        <Badge variant="outline" className="text-sm">
          {tCommon('current_language')}: {currentLanguage}
        </Badge>
      </div>

      {/* 语言切换器演示 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>🌐</span>
            语言切换器组件
          </CardTitle>
          <CardDescription>不同样式的语言切换组件演示</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium">Select 样式</h4>
              <LanguageSwitcher variant="select" showLabel />
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">Button 样式</h4>
              <LanguageSwitcher variant="button" showLabel />
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">紧凑样式</h4>
              <LanguageCompact />
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">不同尺寸</h4>
              <div className="flex items-center gap-2">
                <LanguageSwitcher variant="select" size="sm" />
                <LanguageSwitcher variant="select" size="md" />
                <LanguageSwitcher variant="select" size="lg" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 错误消息演示 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            错误消息多语言支持
          </CardTitle>
          <CardDescription>点击按钮查看不同错误类型的多语言消息</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {/* 网络错误 */}
            <Button
              variant="outline"
              onClick={() => simulateError('NETWORK_ERROR')}
              className="h-auto p-3 flex flex-col items-center gap-2"
            >
              <WifiOff className="h-4 w-4" />
              <span className="text-xs">网络错误</span>
            </Button>

            <Button
              variant="outline"
              onClick={() => simulateError('NETWORK_TIMEOUT')}
              className="h-auto p-3 flex flex-col items-center gap-2"
            >
              <Wifi className="h-4 w-4" />
              <span className="text-xs">超时错误</span>
            </Button>

            {/* 认证错误 */}
            <Button
              variant="outline"
              onClick={() => simulateError('AUTH_TOKEN_EXPIRED')}
              className="h-auto p-3 flex flex-col items-center gap-2"
            >
              <AlertCircle className="h-4 w-4" />
              <span className="text-xs">登录过期</span>
            </Button>

            <Button
              variant="outline"
              onClick={() => simulateError('AUTH_UNAUTHORIZED')}
              className="h-auto p-3 flex flex-col items-center gap-2"
            >
              <AlertCircle className="h-4 w-4" />
              <span className="text-xs">权限不足</span>
            </Button>

            {/* 验证错误 */}
            <Button
              variant="outline"
              onClick={() => simulateError('VALIDATION_REQUIRED_FIELD')}
              className="h-auto p-3 flex flex-col items-center gap-2"
            >
              <Info className="h-4 w-4" />
              <span className="text-xs">必填字段</span>
            </Button>

            <Button
              variant="outline"
              onClick={() => simulateError('VALIDATION_FILE_TOO_LARGE')}
              className="h-auto p-3 flex flex-col items-center gap-2"
            >
              <Info className="h-4 w-4" />
              <span className="text-xs">文件过大</span>
            </Button>

            {/* 服务器错误 */}
            <Button
              variant="outline"
              onClick={() => simulateError('SERVER_INTERNAL_ERROR')}
              className="h-auto p-3 flex flex-col items-center gap-2"
            >
              <AlertCircle className="h-4 w-4" />
              <span className="text-xs">服务器错误</span>
            </Button>

            {/* 编辑器错误 */}
            <Button
              variant="outline"
              onClick={() => simulateError('EDITOR_SAVE_FAILED')}
              className="h-auto p-3 flex flex-col items-center gap-2"
            >
              <AlertCircle className="h-4 w-4" />
              <span className="text-xs">保存失败</span>
            </Button>
          </div>

          <Separator className="my-4" />

          <Button onClick={simulateNetworkError} className="w-full">
            模拟复杂网络错误
          </Button>
        </CardContent>
      </Card>

      {/* 错误消息预览 */}
      <Card>
        <CardHeader>
          <CardTitle>错误消息预览</CardTitle>
          <CardDescription>当前语言下的错误消息示例</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="font-medium text-red-800">网络连接失败</div>
              <div className="text-sm text-red-600 mt-1">{tError('NETWORK_ERROR')}</div>
            </div>

            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <div className="font-medium text-yellow-800">登录已过期</div>
              <div className="text-sm text-yellow-600 mt-1">{tError('AUTH_TOKEN_EXPIRED')}</div>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="font-medium text-blue-800">验证错误</div>
              <div className="text-sm text-blue-600 mt-1">{tError('VALIDATION_REQUIRED_FIELD')}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 功能状态 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Task 5.4 实现状态
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>✅ 统一的错误消息规范</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>✅ 完整的多语言支持框架</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>✅ 前后端多语言集成</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>✅ 语言切换UI组件</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>✅ 类型安全的实现</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
