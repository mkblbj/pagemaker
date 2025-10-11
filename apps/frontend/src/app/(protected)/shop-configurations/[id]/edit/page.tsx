'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { ShopConfigurationForm } from '@/components/shop-configuration/ShopConfigurationForm'
import { shopService } from '@/services/shopService'
import type { ShopConfiguration, UpdateShopConfigurationRequest } from '@pagemaker/shared-types'
import { useTranslation } from '@/contexts/I18nContext'

export default function EditShopConfigurationPage() {
  const params = useParams()
  const { tShopConfig } = useTranslation()
  const [config, setConfig] = useState<ShopConfiguration | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const data = await shopService.getShopConfiguration(params.id as string)
        setConfig(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : tShopConfig('loadError'))
      } finally {
        setLoading(false)
      }
    }

    fetchConfig()
  }, [params.id, tShopConfig])

  const handleUpdate = async (data: UpdateShopConfigurationRequest) => {
    await shopService.updateShopConfiguration(params.id as string, data)
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">{tShopConfig('loading')}</p>
        </div>
      </div>
    )
  }

  if (error || !config) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center py-12">
          <p className="text-destructive">{error || tShopConfig('loadError')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{tShopConfig('editConfig')}</h1>
        <p className="text-muted-foreground mt-2">
          {tShopConfig('description')}
        </p>
      </div>
      <ShopConfigurationForm mode="edit" initialData={config} onSubmit={handleUpdate} />
    </div>
  )
}
