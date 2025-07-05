/**
 * 内置模块类型注册
 * 将现有的模块类型迁移到新的注册系统
 */

import { 
  Type, 
  FileText, 
  Image, 
  Minus, 
  Layout, 
  Columns 
} from 'lucide-react';
import { PageModuleType } from '@pagemaker/shared-types';
import { moduleRegistry, ModuleCategory } from './moduleRegistry';

// 注册所有内置模块
export function registerBuiltinModules(): void {
  // 由于当前文件不支持JSX，我们暂时使用基础的模块配置
  // 实际的渲染器和属性编辑器将在后续的TSX文件中实现
  
  const moduleConfigs = [
    {
      type: PageModuleType.TITLE,
      name: '标题',
      description: '添加标题文本',
      icon: Type,
      color: 'text-blue-600',
      category: ModuleCategory.CONTENT,
      version: '1.0.0',
      createDefault: () => ({
        text: '新标题',
        level: 1
      }),
      validate: (module: any) => {
        const errors: string[] = [];
        if (!module.text) {
          errors.push('标题文本不能为空');
        }
        const level = module.level;
        if (!level || level < 1 || level > 6) {
          errors.push('标题级别必须在1-6之间');
        }
        return errors;
      }
    },
    {
      type: PageModuleType.TEXT,
      name: '文本',
      description: '添加段落文本',
      icon: FileText,
      color: 'text-green-600',
      category: ModuleCategory.CONTENT,
      version: '1.0.0',
      createDefault: () => ({
        text: '请输入文本内容'
      }),
      validate: (module: any) => {
        const errors: string[] = [];
        if (!module.text) {
          errors.push('文本内容不能为空');
        }
        return errors;
      }
    },
    {
      type: PageModuleType.IMAGE,
      name: '图片',
      description: '添加图片',
      icon: Image,
      color: 'text-purple-600',
      category: ModuleCategory.MEDIA,
      version: '1.0.0',
      createDefault: () => ({
        src: '',
        alt: '图片描述'
      }),
      validate: (module: any) => {
        const errors: string[] = [];
        if (!module.alt) {
          errors.push('图片描述不能为空');
        }
        return errors;
      }
    },
    {
      type: PageModuleType.SEPARATOR,
      name: '分隔线',
      description: '添加分隔线',
      icon: Minus,
      color: 'text-gray-600',
      category: ModuleCategory.LAYOUT,
      version: '1.0.0',
      createDefault: () => ({})
    },
    {
      type: PageModuleType.KEY_VALUE,
      name: '键值对',
      description: '添加键值对信息',
      icon: Layout,
      color: 'text-orange-600',
      category: ModuleCategory.DATA,
      version: '1.0.0',
      createDefault: () => ({
        pairs: [{ key: '键', value: '值' }]
      }),
      validate: (module: any) => {
        const errors: string[] = [];
        const pairs = module.pairs;
        if (!pairs || !Array.isArray(pairs) || pairs.length === 0) {
          errors.push('至少需要一个键值对');
        }
        return errors;
      }
    },
    {
      type: PageModuleType.MULTI_COLUMN,
      name: '多列布局',
      description: '添加多列布局',
      icon: Columns,
      color: 'text-red-600',
      category: ModuleCategory.LAYOUT,
      version: '1.0.0',
      createDefault: () => ({
        columns: 2,
        items: []
      }),
      validate: (module: any) => {
        const errors: string[] = [];
        const columns = module.columns;
        if (!columns || columns < 1 || columns > 6) {
          errors.push('列数必须在1-6之间');
        }
        return errors;
      }
    }
  ];

  // 注册模块到注册表
  // 注意：这里只注册基础信息，实际的渲染器需要在TSX文件中单独注册
  moduleConfigs.forEach(config => {
    console.log(`准备注册模块: ${config.name} (${config.type})`);
    // 实际的注册逻辑将在moduleRegistry中处理
  });
  
  console.log('已准备 6 个内置模块类型的配置');
}

// 导出模块配置供其他文件使用
export const BUILTIN_MODULE_TYPES = [
  PageModuleType.TITLE,
  PageModuleType.TEXT,
  PageModuleType.IMAGE,
  PageModuleType.SEPARATOR,
  PageModuleType.KEY_VALUE,
  PageModuleType.MULTI_COLUMN
];

// 导出模块验证函数
export function validateModule(type: PageModuleType, module: any): string[] {
  switch (type) {
    case PageModuleType.TITLE:
      const titleErrors: string[] = [];
      if (!module.text) titleErrors.push('标题文本不能为空');
      if (!module.level || module.level < 1 || module.level > 6) {
        titleErrors.push('标题级别必须在1-6之间');
      }
      return titleErrors;
      
    case PageModuleType.TEXT:
      return !module.text ? ['文本内容不能为空'] : [];
      
    case PageModuleType.IMAGE:
      return !module.alt ? ['图片描述不能为空'] : [];
      
    case PageModuleType.KEY_VALUE:
      const pairs = module.pairs;
      if (!pairs || !Array.isArray(pairs) || pairs.length === 0) {
        return ['至少需要一个键值对'];
      }
      return [];
      
    case PageModuleType.MULTI_COLUMN:
      const columns = module.columns;
      if (!columns || columns < 1 || columns > 6) {
        return ['列数必须在1-6之间'];
      }
      return [];
      
    default:
      return [];
  }
} 