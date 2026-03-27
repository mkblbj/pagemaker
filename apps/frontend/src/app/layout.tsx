import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { I18nProvider } from '@/contexts/I18nContext'
import { BRAND_METADATA_DESCRIPTION, BRAND_NAME } from '@/lib/brand'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin']
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin']
})

export const metadata: Metadata = {
  title: BRAND_NAME,
  description: BRAND_METADATA_DESCRIPTION
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <I18nProvider defaultLanguage="zh-CN">
          <div id="root">{children}</div>
        </I18nProvider>
      </body>
    </html>
  )
}
