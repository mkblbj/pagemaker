'use client'

import { use } from 'react'
import { ShopConfigurationForm } from '@/components/shop-configuration/ShopConfigurationForm'
import { shopService } from '@/services/shopService'
import useSWR from 'swr'
import { AlertCircle } from 'lucide-react'
import type { UpdateShopConfigurationRequest } from '@pagemaker/shared-types'

export default function EditShopConfigurationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  
  const { data: configuration, error, isLoading } = useSWR(
    `/shop-configurations/${id}`,
    () => shopService.getShopConfiguration(id)
  )

  const handleSubmit = async (data: UpdateShopConfigurationRequest) => {
    await shopService.updateShopConfiguration(id, data)
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">加载中...</p>
        </div>
      </div>
    )
  }

  if (error || !configuration) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="flex items-center justify-center py-12 text-destructive">
          <AlertCircle className="mr-2 h-5 w-5" />
          <p>加载店铺配置失败: {error?.message || '未找到配置'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">编辑店铺配置</h1>
        <p className="text-muted-foreground mt-2">
          修改店铺"{configuration.shop_name}"的配置信息
        </p>
      </div>

      <ShopConfigurationForm
        mode="edit"
        initialData={configuration}
        onSubmit={handleSubmit}
      />
    </div>
  )
}


