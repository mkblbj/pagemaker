'use client'

import { useEffect } from 'react'

export default function TestEnvPage() {
  useEffect(() => {
    console.log('NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL)
    console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL)
    console.log('NODE_ENV:', process.env.NODE_ENV)
  }, [])

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">环境变量测试</h1>
      <div className="space-y-2">
        <div>
          <strong>NEXT_PUBLIC_API_URL:</strong> {process.env.NEXT_PUBLIC_API_URL || '未设置'}
        </div>
        <div>
          <strong>NEXTAUTH_URL:</strong> {process.env.NEXTAUTH_URL || '未设置'}
        </div>
        <div>
          <strong>NODE_ENV:</strong> {process.env.NODE_ENV || '未设置'}
        </div>
      </div>
    </div>
  )
}
