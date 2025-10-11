'use client'

import { ShopConfigurationForm } from '@/components/shop-configuration/ShopConfigurationForm'
import { shopService } from '@/services/shopService'
import type { CreateShopConfigurationRequest } from '@pagemaker/shared-types'

export default function NewShopConfigurationPage() {
  const handleSubmit = async (data: CreateShopConfigurationRequest) => {
    await shopService.createShopConfiguration(data)
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">新增店铺配置</h1>
        <p className="text-muted-foreground mt-2">
          填写店铺的乐天API和FTP凭据信息
        </p>
      </div>

      <ShopConfigurationForm mode="create" onSubmit={handleSubmit} />
    </div>
  )
}


