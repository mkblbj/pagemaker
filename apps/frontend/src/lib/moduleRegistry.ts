/**
 * 模块类型注册系统
 * 支持插件式扩展和动态注册新模块类型
 */

import { PageModuleType, ModuleMetadata, PageModule } from '@pagemaker/shared-types'
import { createTranslator, getBrowserLanguage, type SupportedLanguage } from '@pagemaker/shared-i18n'

// 动态创建翻译函数
function createTEditor(language?: SupportedLanguage) {
  const lang = language || getBrowserLanguage()
  const t = createTranslator(lang)
  return (key: string) => t(`editor.${key}`)
}

// 动态创建基础模块注册表
function createModuleRegistry(language?: SupportedLanguage): Record<PageModuleType, ModuleMetadata> {
  const tEditor = createTEditor(language)

  return {
    [PageModuleType.TITLE]: {
      type: PageModuleType.TITLE,
      name: tEditor('标题'),
      description: tEditor('添加标题文本'),
      icon: 'Type',
      category: 'basic',
      color: 'text-blue-600',
      defaultConfig: {
        text: 'タイトルテキスト',
        level: 1,
        alignment: 'left',
        color: '#000000',
        fontFamily: 'inherit',
        fontWeight: 'bold'
      },
      isEnabled: true,
      sortOrder: 1
    },
    [PageModuleType.TEXT]: {
      type: PageModuleType.TEXT,
      name: tEditor('文本'),
      description: tEditor('添加文本内容'),
      icon: 'FileText',
      category: 'basic',
      color: 'text-green-600',
      defaultConfig: {
        content: '', // 空字符串，让组件显示placeholder
        fontSize: '4', // 修改为4，匹配属性面板默认值
        fontFamily: 'inherit',
        alignment: 'left',
        textColor: '#000000',
        backgroundColor: 'transparent'
      },
      isEnabled: true,
      sortOrder: 2
    },
    [PageModuleType.IMAGE]: {
      type: PageModuleType.IMAGE,
      name: tEditor('图片'),
      description: tEditor('添加图片'),
      icon: 'Image',
      category: 'basic',
      color: 'text-purple-600',
      defaultConfig: {
        src: '',
        alt: tEditor('图片描述'),
        alignment: 'center',
        size: {
          type: 'preset',
          value: 'full'
        }
      },
      isEnabled: true,
      sortOrder: 3
    },
    [PageModuleType.SEPARATOR]: {
      type: PageModuleType.SEPARATOR,
      name: tEditor('分隔线'),
      description: tEditor('添加分隔线或空白间距'),
      icon: 'Minus',
      category: 'basic',
      color: 'text-gray-600',
      defaultConfig: {
        separatorType: 'line',
        lineStyle: 'solid',
        lineColor: '#e5e7eb',
        lineThickness: 1,
        spaceHeight: 'medium'
      },
      isEnabled: true,
      sortOrder: 4
    },
    [PageModuleType.KEY_VALUE]: {
      type: PageModuleType.KEY_VALUE,
      name: tEditor('键值对'),
      description: tEditor('添加键值对表格'),
      icon: 'Layout',
      category: 'basic',
      color: 'text-orange-600',
      defaultConfig: {
        rows: [{ key: tEditor('键'), value: tEditor('值') }],
        labelBackgroundColor: '#f3f4f6',
        textColor: '#374151'
      },
      isEnabled: true,
      sortOrder: 5
    },
    [PageModuleType.MULTI_COLUMN]: {
      type: PageModuleType.MULTI_COLUMN,
      name: tEditor('多列图文'),
      description: tEditor('添加多列图文组合'),
      icon: 'Columns',
      category: 'layout',
      color: 'text-red-600',
      defaultConfig: {
        layout: 'imageLeft',
        imageConfig: {
          src: '',
          alt: tEditor('图片描述'),
          alignment: 'center',
          width: '100%'
        },
        textConfig: {
          content: '', // 空字符串，让组件显示placeholder
          alignment: 'left',
          font: 'inherit',
          fontSize: '4', // 修改为4，匹配属性面板默认值
          color: '#000000',
          backgroundColor: 'transparent'
        },
        columnRatio: '1:1' // MVP阶段固定比例
      },
      isEnabled: true,
      sortOrder: 6
    }
  }
}

/**
 * 获取所有可用模块
 */
export function getAvailableModules(language?: SupportedLanguage, targetArea?: string): ModuleMetadata[] {
  const registry = createModuleRegistry(language)
  const tEditor = createTEditor(language)

  // 添加自定义HTML模块
  const customModule: ModuleMetadata = {
    type: PageModuleType.CUSTOM,
    name: tEditor('自定义HTML模块'),
    description: tEditor('添加自定义HTML代码'),
    icon: 'Code',
    category: 'advanced',
    color: 'text-pink-600',
    defaultConfig: {
      customHTML: '',
      name: tEditor('自定义HTML模块')
    },
    isEnabled: true,
    sortOrder: 10
  }

  const allModules = [...Object.values(registry), customModule]

  return allModules
    .filter(module => module.isEnabled)
    .map(module => {
      // 乐天规则：手机页面不允许使用标题标签
      if (module.type === PageModuleType.TITLE && targetArea === 'mobile') {
        return {
          ...module,
          isEnabled: false,
          color: 'text-gray-400',
          name: `${module.name} (${tEditor('手机页面不可用')})`,
          description: `${module.description} - ${tEditor('乐天规则：手机页面不允许使用H1-H6标签')}`
        }
      }
      return module
    })
    .sort((a, b) => a.sortOrder - b.sortOrder)
}

/**
 * 根据分类获取模块
 */
export function getModulesByCategory(
  category: 'basic' | 'advanced' | 'layout',
  language?: SupportedLanguage,
  targetArea?: string
): ModuleMetadata[] {
  return getAvailableModules(language, targetArea).filter(module => module.category === category)
}

/**
 * 获取特定模块的元数据
 */
export function getModuleMetadata(type: PageModuleType, language?: SupportedLanguage): ModuleMetadata | undefined {
  const registry = createModuleRegistry(language)
  return registry[type]
}

/**
 * 创建新的模块实例
 */
export function createModuleInstance(type: PageModuleType | 'custom', language?: SupportedLanguage): PageModule {
  // 处理自定义模块
  if (type === 'custom') {
    const tEditor = createTEditor(language)
    return {
      id: `module-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: PageModuleType.CUSTOM,
      customHTML: '',
      name: tEditor('自定义HTML模块')
    } as any
  }

  const metadata = getModuleMetadata(type, language)
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
export function registerModule(_metadata: ModuleMetadata): void {
  // 这个功能需要重新设计以支持动态注册
  console.warn('registerModule needs to be redesigned for dynamic registration')
}

/**
 * 禁用/启用模块类型
 */
export function toggleModuleEnabled(_type: PageModuleType, _enabled: boolean): void {
  // 这个功能需要重新设计以支持动态切换
  console.warn('toggleModuleEnabled needs to be redesigned for dynamic toggling')
}
