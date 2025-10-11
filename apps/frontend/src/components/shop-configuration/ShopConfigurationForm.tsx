'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { Eye, EyeOff, Save, X } from 'lucide-react'
import type { ShopConfiguration, CreateShopConfigurationRequest, UpdateShopConfigurationRequest } from '@pagemaker/shared-types'

interface ShopConfigurationFormProps {
  mode: 'create' | 'edit'
  initialData?: ShopConfiguration
  onSubmit: (data: CreateShopConfigurationRequest | UpdateShopConfigurationRequest) => Promise<void>
}

export function ShopConfigurationForm({ mode, initialData, onSubmit }: ShopConfigurationFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPasswords, setShowPasswords] = useState({
    apiServiceSecret: false,
    apiLicenseKey: false,
    ftpPassword: false,
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateShopConfigurationRequest>({
    defaultValues: initialData ? {
      shop_name: initialData.shop_name,
      target_area: initialData.target_area,
      api_service_secret: initialData.api_service_secret,
      api_license_key: initialData.api_license_key,
      ftp_host: initialData.ftp_host,
      ftp_port: initialData.ftp_port,
      ftp_user: initialData.ftp_user,
      ftp_password: initialData.ftp_password,
    } : {
      ftp_port: 21,
    },
  })

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field],
    }))
  }

  const onFormSubmit = async (data: CreateShopConfigurationRequest) => {
    try {
      setIsSubmitting(true)
      await onSubmit(data)
      
      toast({
        title: mode === 'create' ? '创建成功' : '更新成功',
        description: `店铺配置已${mode === 'create' ? '创建' : '更新'}`,
      })
      
      router.push('/shop-configurations')
    } catch (error) {
      toast({
        variant: 'destructive',
        title: mode === 'create' ? '创建失败' : '更新失败',
        description: error instanceof Error ? error.message : '操作失败，请重试',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>基本信息</CardTitle>
          <CardDescription>配置店铺的基本标识信息</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="shop_name">
              店铺名称 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="shop_name"
              {...register('shop_name', { required: '请输入店铺名称' })}
              placeholder="例如: 旗舰店"
            />
            {errors.shop_name && (
              <p className="text-sm text-destructive">{errors.shop_name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="target_area">
              目标区域 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="target_area"
              {...register('target_area', { required: '请输入目标区域' })}
              placeholder="例如: pc, mobile, 0901, 3911"
            />
            {errors.target_area && (
              <p className="text-sm text-destructive">{errors.target_area.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              此字段用于关联页面模板，确保唯一性
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>乐天API配置</CardTitle>
          <CardDescription>配置乐天R-Cabinet API凭据</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="api_service_secret">
              API Service Secret <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Input
                id="api_service_secret"
                type={showPasswords.apiServiceSecret ? 'text' : 'password'}
                {...register('api_service_secret', { required: '请输入API Service Secret' })}
                placeholder="SP******"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('apiServiceSecret')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPasswords.apiServiceSecret ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.api_service_secret && (
              <p className="text-sm text-destructive">{errors.api_service_secret.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="api_license_key">
              API License Key <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Input
                id="api_license_key"
                type={showPasswords.apiLicenseKey ? 'text' : 'password'}
                {...register('api_license_key', { required: '请输入API License Key' })}
                placeholder="SL******"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('apiLicenseKey')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPasswords.apiLicenseKey ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.api_license_key && (
              <p className="text-sm text-destructive">{errors.api_license_key.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>FTP配置</CardTitle>
          <CardDescription>配置乐天FTP服务器连接信息</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ftp_host">
                FTP主机 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="ftp_host"
                {...register('ftp_host', { required: '请输入FTP主机地址' })}
                placeholder="upload.rakuten.ne.jp"
              />
              {errors.ftp_host && (
                <p className="text-sm text-destructive">{errors.ftp_host.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="ftp_port">
                FTP端口 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="ftp_port"
                type="number"
                {...register('ftp_port', {
                  required: '请输入FTP端口',
                  min: { value: 1, message: '端口号必须在1-65535之间' },
                  max: { value: 65535, message: '端口号必须在1-65535之间' },
                  valueAsNumber: true,
                })}
                placeholder="21"
              />
              {errors.ftp_port && (
                <p className="text-sm text-destructive">{errors.ftp_port.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ftp_user">
              FTP用户名 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="ftp_user"
              {...register('ftp_user', { required: '请输入FTP用户名' })}
              placeholder="_shop_*****"
            />
            {errors.ftp_user && (
              <p className="text-sm text-destructive">{errors.ftp_user.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="ftp_password">
              FTP密码 <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Input
                id="ftp_password"
                type={showPasswords.ftpPassword ? 'text' : 'password'}
                {...register('ftp_password', { required: '请输入FTP密码' })}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('ftpPassword')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPasswords.ftpPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.ftp_password && (
              <p className="text-sm text-destructive">{errors.ftp_password.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/shop-configurations')}
          disabled={isSubmitting}
        >
          <X className="mr-2 h-4 w-4" />
          取消
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              保存中...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {mode === 'create' ? '创建' : '更新'}
            </>
          )}
        </Button>
      </div>
    </form>
  )
}


