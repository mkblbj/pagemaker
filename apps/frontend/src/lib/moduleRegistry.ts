/**
 * 模块类型注册系统
 * 支持插件式扩展和动态注册新模块类型
 */

import { PageModuleType, ModuleMetadata, PageModule } from '@pagemaker/shared-types'

// 基础模块注册表 - 多语言版本
function createModuleRegistry(t: (key: string) => string): Record<PageModuleType, ModuleMetadata> {
  return {
    [PageModuleType.TITLE]: {
      type: PageModuleType.TITLE,
      name: t('editor.标题'),
      description: t('editor.添加标题文本'),
      icon: 'Type',
      category: 'basic',
      color: 'text-blue-600',
      defaultConfig: {
        text: t('editor.标题文本'),
        level: 1,
        alignment: 'left',
        color: '#000000'
      },
      isEnabled: true,
      sortOrder: 1
    },
    [PageModuleType.TEXT]: {
      type: PageModuleType.TEXT,
      name: t('editor.文本'),
      description: t('editor.添加文本内容'),
      icon: 'FileText',
      category: 'basic',
      color: 'text-green-600',
      defaultConfig: {
        text: t('editor.输入文本内容'),
        fontSize: 14,
        alignment: 'left',
        color: '#000000'
      },
      isEnabled: true,
      sortOrder: 2
    },
    [PageModuleType.IMAGE]: {
      type: PageModuleType.IMAGE,
      name: t('editor.图片'),
      description: t('editor.添加图片'),
      icon: 'Image',
      category: 'basic',
      color: 'text-purple-600',
      defaultConfig: {
        src: '',
        alt: t('editor.图片描述'),
        width: 100,
        alignment: 'center'
      },
      isEnabled: true,
      sortOrder: 3
    },
    [PageModuleType.SEPARATOR]: {
      type: PageModuleType.SEPARATOR,
      name: t('editor.分隔线'),
      description: t('editor.添加分隔线'),
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
      name: t('editor.键值对'),
      description: t('editor.添加键值对'),
      icon: 'Layout',
      category: 'basic',
      color: 'text-orange-600',
      defaultConfig: {
        pairs: [{ key: t('editor.键'), value: t('editor.值') }],
        itemStyle: 'default',
        keyColor: '#374151',
        valueColor: '#6b7280'
      },
      isEnabled: true,
      sortOrder: 5
    },
    [PageModuleType.MULTI_COLUMN]: {
      type: PageModuleType.MULTI_COLUMN,
      name: t('editor.多列布局'),
      description: t('editor.添加多列布局'),
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
}

/**
 * 获取所有可用模块
 */
export function getAvailableModules(t: (key: string) => string): ModuleMetadata[] {
  const registry = createModuleRegistry(t)
  return Object.values(registry)
    .filter(module => module.isEnabled)
    .sort((a, b) => a.sortOrder - b.sortOrder)
}

/**
 * 根据分类获取模块
 */
export function getModulesByCategory(
  category: 'basic' | 'advanced' | 'layout',
  t: (key: string) => string
): ModuleMetadata[] {
  return getAvailableModules(t).filter(module => module.category === category)
}

/**
 * 获取特定模块的元数据
 */
export function getModuleMetadata(type: PageModuleType, t?: (key: string) => string): ModuleMetadata | undefined {
  if (!t) {
    // 如果没有提供翻译函数，返回英文默认值
    const fallbackT = (key: string) => {
      const keyMap: Record<string, string> = {
        'editor.标题': 'Title',
        'editor.文本': 'Text',
        'editor.图片': 'Image',
        'editor.分隔线': 'Separator',
        'editor.键值对': 'Key-Value',
        'editor.多列布局': 'Multi-Column',
        'editor.添加标题文本': 'Add title text',
        'editor.添加文本内容': 'Add text content',
        'editor.添加图片': 'Add image',
        'editor.添加分隔线': 'Add separator',
        'editor.添加键值对': 'Add key-value pairs',
        'editor.添加多列布局': 'Add multi-column layout',
        'editor.标题文本': 'Title text',
        'editor.输入文本内容': 'Enter text content',
        'editor.图片描述': 'Image description',
        'editor.键': 'Key',
        'editor.值': 'Value'
      }
      return keyMap[key] || key
    }
    const registry = createModuleRegistry(fallbackT)
    return registry[type]
  }

  const registry = createModuleRegistry(t)
  return registry[type]
}

/**
 * 创建新的模块实例
 */
export function createModuleInstance(type: PageModuleType, t?: (key: string) => string): PageModule {
  const metadata = getModuleMetadata(type, t)
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
  // 注册功能需要重新设计以支持多语言
  console.warn('registerModule needs to be redesigned for i18n support')
}

/**
 * 禁用/启用模块类型
 */
export function toggleModuleEnabled(type: PageModuleType, enabled: boolean): void {
  // 这个功能需要重新设计以支持多语言
  console.warn('toggleModuleEnabled needs to be redesigned for i18n support')
}
