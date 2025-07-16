import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { I18nProvider } from '@/contexts/I18nContext'

// Mock localStorage for tests
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: () => 'zh-CN', // 强制返回中文
    setItem: () => {},
    removeItem: () => {},
    clear: () => {}
  },
  writable: true
})

// 创建自定义的 render 函数，包含 I18nProvider
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return <I18nProvider defaultLanguage="zh-CN">{children}</I18nProvider>
}

const customRender = (ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) =>
  render(ui, { wrapper: AllTheProviders, ...options })

// 重新导出所有内容
export * from '@testing-library/react'

// 覆盖 render 方法
export { customRender as render }
