'use client'

import { ShopConfigurationForm } from '@/components/shop-configuration/ShopConfigurationForm'
import { shopService } from '@/services/shopService'
import type { CreateShopConfigurationRequest } from '@pagemaker/shared-types'
import { useTranslation } from '@/contexts/I18nContext'

export default function NewShopConfigurationPage() {
  const { tShopConfig } = useTranslation()

  const handleCreate = async (data: CreateShopConfigurationRequest) => {
    await shopService.createShopConfiguration(data)
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{tShopConfig('createConfig')}</h1>
        <p className="text-muted-foreground mt-2">
          {tShopConfig('description')}
        </p>
      </div>
      <ShopConfigurationForm mode="create" onSubmit={handleCreate} />
    </div>
  )
}
