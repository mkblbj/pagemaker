'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Eye, EyeOff, Save, X } from 'lucide-react'
import type { ShopConfiguration, CreateShopConfigurationRequest, UpdateShopConfigurationRequest } from '@pagemaker/shared-types'
import { useTranslation } from '@/contexts/I18nContext'

interface ShopConfigurationFormProps {
  mode: 'create' | 'edit'
  initialData?: ShopConfiguration
  onSubmit: (data: CreateShopConfigurationRequest | UpdateShopConfigurationRequest) => Promise<void>
}

export function ShopConfigurationForm({ mode, initialData, onSubmit }: ShopConfigurationFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { tShopConfig, tCommon } = useTranslation()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPasswords, setShowPasswords] = useState({
    apiServiceSecret: false,
    apiLicenseKey: false,
    ftpPassword: false,
  })

  const {
    register,
    handleSubmit,
    setValue,
    watch,
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
      ftp_host: 'upload.rakuten.ne.jp',
      ftp_port: 21,
    },
  })

  const ftpHost = watch('ftp_host')

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
        title: tShopConfig(mode === 'create' ? 'createSuccess' : 'updateSuccess'),
        description: tShopConfig(mode === 'create' ? 'createSuccessDesc' : 'updateSuccessDesc'),
      })
      
      router.push('/shop-configurations')
    } catch (error) {
      toast({
        variant: 'destructive',
        title: tShopConfig(mode === 'create' ? 'createFailed' : 'updateFailed'),
        description: error instanceof Error ? error.message : tShopConfig('operationFailed'),
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{tShopConfig('basicInfo')}</CardTitle>
          <CardDescription>{tShopConfig('basicInfoDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="shop_name">
              {tShopConfig('shopName')} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="shop_name"
              {...register('shop_name', { required: tShopConfig('shopNameRequired') })}
              placeholder={tShopConfig('shopNamePlaceholder')}
            />
            {errors.shop_name && (
              <p className="text-sm text-destructive">{errors.shop_name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="target_area">
              {tShopConfig('targetArea')} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="target_area"
              {...register('target_area', { required: tShopConfig('targetAreaRequired') })}
              placeholder={tShopConfig('targetAreaPlaceholder')}
            />
            {errors.target_area && (
              <p className="text-sm text-destructive">{errors.target_area.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {tShopConfig('targetAreaDesc')}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{tShopConfig('apiConfig')}</CardTitle>
          <CardDescription>{tShopConfig('apiConfigDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="api_service_secret">
              {tShopConfig('apiServiceSecret')} <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Input
                id="api_service_secret"
                type={showPasswords.apiServiceSecret ? 'text' : 'password'}
                {...register('api_service_secret', { required: tShopConfig('apiServiceSecretRequired') })}
                placeholder={tShopConfig('apiServiceSecretPlaceholder')}
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
              {tShopConfig('apiLicenseKey')} <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Input
                id="api_license_key"
                type={showPasswords.apiLicenseKey ? 'text' : 'password'}
                {...register('api_license_key', { required: tShopConfig('apiLicenseKeyRequired') })}
                placeholder={tShopConfig('apiLicenseKeyPlaceholder')}
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
          <CardTitle>{tShopConfig('ftpConfig')}</CardTitle>
          <CardDescription>{tShopConfig('ftpConfigDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ftp_host">
                {tShopConfig('ftpHost')} <span className="text-destructive">*</span>
              </Label>
              <Select
                value={ftpHost || 'upload.rakuten.ne.jp'}
                onValueChange={(value) => setValue('ftp_host', value)}
              >
                <SelectTrigger id="ftp_host">
                  <SelectValue placeholder={tShopConfig('ftpHostPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upload.rakuten.ne.jp">upload.rakuten.ne.jp（乐天标准）</SelectItem>
                  <SelectItem value="custom">自定义...</SelectItem>
                </SelectContent>
              </Select>
              {ftpHost === 'custom' && (
                <Input
                  {...register('ftp_host', { required: tShopConfig('ftpHostRequired') })}
                  placeholder="输入自定义FTP地址"
                  className="mt-2"
                />
              )}
              {errors.ftp_host && (
                <p className="text-sm text-destructive">{errors.ftp_host.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="ftp_port">
                {tShopConfig('ftpPort')} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="ftp_port"
                type="number"
                {...register('ftp_port', {
                  required: tShopConfig('ftpPortRequired'),
                  min: { value: 1, message: tShopConfig('ftpPortRange') },
                  max: { value: 65535, message: tShopConfig('ftpPortRange') },
                  valueAsNumber: true,
                })}
                placeholder={tShopConfig('ftpPortPlaceholder')}
              />
              {errors.ftp_port && (
                <p className="text-sm text-destructive">{errors.ftp_port.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ftp_user">
              {tShopConfig('ftpUser')} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="ftp_user"
              {...register('ftp_user', { required: tShopConfig('ftpUserRequired') })}
              placeholder={tShopConfig('ftpUserPlaceholder')}
            />
            {errors.ftp_user && (
              <p className="text-sm text-destructive">{errors.ftp_user.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="ftp_password">
              {tShopConfig('ftpPassword')} <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Input
                id="ftp_password"
                type={showPasswords.ftpPassword ? 'text' : 'password'}
                {...register('ftp_password', { required: tShopConfig('ftpPasswordRequired') })}
                placeholder={tShopConfig('ftpPasswordPlaceholder')}
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
          {tCommon('cancel')}
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              {tCommon('saving')}
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {mode === 'create' ? tCommon('create') : tCommon('update')}
            </>
          )}
        </Button>
      </div>
    </form>
  )
}

