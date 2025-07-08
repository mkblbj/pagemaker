/**
 * 模块类型注册系统
 * 支持插件式扩展和动态注册新模块类型
 */

import { PageModuleType, ModuleMetadata, PageModule } from '@pagemaker/shared-types'

// 基础模块注册表
const MODULE_REGISTRY: Record<PageModuleType, ModuleMetadata> = {
  [PageModuleType.TITLE]: {
    type: PageModuleType.TITLE,
    name: '标题',
    description: '添加标题文本',
    icon: 'Type',
    category: 'basic',
    color: 'text-blue-600',
    defaultConfig: {
      text: '新标题',
      level: 1,
      alignment: 'left',
      color: '#000000'
    },
    isEnabled: true,
    sortOrder: 1
  },
  [PageModuleType.TEXT]: {
    type: PageModuleType.TEXT,
    name: '文本',
    description: '添加段落文本',
    icon: 'FileText',
    category: 'basic',
    color: 'text-green-600',
    defaultConfig: {
      text: '请输入文本内容',
      fontSize: 14,
      alignment: 'left',
      color: '#000000'
    },
    isEnabled: true,
    sortOrder: 2
  },
  [PageModuleType.IMAGE]: {
    type: PageModuleType.IMAGE,
    name: '图片',
    description: '添加图片',
    icon: 'Image',
    category: 'basic',
    color: 'text-purple-600',
    defaultConfig: {
      src: '',
      alt: '图片描述',
      width: 100,
      alignment: 'center'
    },
    isEnabled: true,
    sortOrder: 3
  },
  [PageModuleType.SEPARATOR]: {
    type: PageModuleType.SEPARATOR,
    name: '分隔线',
    description: '添加分隔线',
    icon: 'Minus',
    category: 'basic',
    color: 'text-gray-600',
    defaultConfig: {
      lineStyle: 'solid',
      color: '#e5e7eb',
      thickness: 1
    },
    isEnabled: true,
    sortOrder: 4
  },
  [PageModuleType.KEY_VALUE]: {
    type: PageModuleType.KEY_VALUE,
    name: '键值对',
    description: '添加键值对信息',
    icon: 'Layout',
    category: 'basic',
    color: 'text-orange-600',
    defaultConfig: {
      pairs: [{ key: '键', value: '值' }],
      itemStyle: 'default',
      keyColor: '#374151',
      valueColor: '#6b7280'
    },
    isEnabled: true,
    sortOrder: 5
  },
  [PageModuleType.MULTI_COLUMN]: {
    type: PageModuleType.MULTI_COLUMN,
    name: '多列布局',
    description: '添加多列布局',
    icon: 'Columns',
    category: 'layout',
    color: 'text-red-600',
    defaultConfig: {
      columns: 2,
      items: []
    },
    isEnabled: true,
    sortOrder: 6
  }
}

/**
 * 获取所有可用模块
 */
export function getAvailableModules(): ModuleMetadata[] {
  return Object.values(MODULE_REGISTRY)
    .filter(module => module.isEnabled)
    .sort((a, b) => a.sortOrder - b.sortOrder)
}

/**
 * 根据分类获取模块
 */
export function getModulesByCategory(category: 'basic' | 'advanced' | 'layout'): ModuleMetadata[] {
  return getAvailableModules().filter(module => module.category === category)
}

/**
 * 获取特定模块的元数据
 */
export function getModuleMetadata(type: PageModuleType): ModuleMetadata | undefined {
  return MODULE_REGISTRY[type]
}

/**
 * 创建新的模块实例
 */
export function createModuleInstance(type: PageModuleType): PageModule {
  const metadata = getModuleMetadata(type)
  if (!metadata) {
    throw new Error(`Unknown module type: ${type}`)
  }

  return {
    id: `module-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    ...metadata.defaultConfig
  }
}

/**
 * 验证模块类型是否有效
 */
export function isValidModuleType(type: string): type is PageModuleType {
  return Object.values(PageModuleType).includes(type as PageModuleType)
}

/**
 * 注册新的模块类型（用于扩展）
 */
export function registerModule(metadata: ModuleMetadata): void {
  MODULE_REGISTRY[metadata.type] = metadata
}

/**
 * 禁用/启用模块类型
 */
export function toggleModuleEnabled(type: PageModuleType, enabled: boolean): void {
  if (MODULE_REGISTRY[type]) {
    MODULE_REGISTRY[type].isEnabled = enabled
  }
}
